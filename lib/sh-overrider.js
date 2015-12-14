var CMD_OVERRIDE_BASE = 'SQUISH_SQUASH';
var CMD_OVERRIDE_COUNT = 0;
var ss = require('child_process').spawnSync;
var path = require('path');
var assign = require('lodash.assign');
var ostmpdir = require('os-tmpdir');
var crypto = require('crypto');
var fs = require('fs');

/**
 * temporarily squash some other command.
 * this is similar to using a bash `alias`, but doesn't modify the user's env,
 * instead, just the process' env
 * @ref http://stackoverflow.com/questions/34100700/temporary-alias-a-cmd-to-squash-an-existing-command-then-expire-upon-script-exi
 * @param {object}  opts
 * @param {object}  opts.squash  name of command to squash, e.g. `ls`
 * @param {string=} opts.syscmd  command to squash with, available in the
 *                               existing env. e.g. `ls -al`
 * @param {string=} opts.cmdpath /path/to/binary to use instead of the `squash`ed binary
 * @return {undefined}
 */
module.exports = function(opts) {
    var CMD_OVERRIDE_DIR = CMD_OVERRIDE_BASE + '_' + CMD_OVERRIDE_COUNT.toString();
    ++CMD_OVERRIDE_COUNT;
    var cmdpath;

    if (!opts.squash) {
        throw new ReferenceError('`squash` property must be provided');
    }
    if (typeof opts.cmdpath === 'string') {
        cmdpath = opts.cmdpath;
    } else if (typeof opts.syscmd === 'string') {
        cmdpath = ss('which', [opts.syscmd]);
        cmdpath = cmdpath.stdout.toString().match(/.*[a-zA-Z]/)[0];
    } else {
        throw new ReferenceError('expected cmdpath or syscmd props');
    }

    // build temp dir that we will make a sym link to our desired squash cmd
    var tmpdir = path.join(
        ostmpdir(),
        CMD_OVERRIDE_DIR + '_' + crypto.randomBytes(5).toString('hex')
    );
    fs.mkdirSync(tmpdir);

    // update env with new PATH to our temporary binary squashing dir
    process.env = assign({}, process.env, { 'PATH': tmpdir + ':' + process.env.PATH });

    var linkResult = ss('ln', ['-s', path.resolve(cmdpath), path.resolve(tmpdir, opts.squash) ], { stdio: 'inherit' });

    // assert that the temp dir and link will be removed when our child process exits
    var tidyup = function() {
        fs.unlinkSync(path.join(tmpdir, opts.squash));
        fs.rmdirSync(tmpdir);
    };
    process.on('exit', tidyup);

};
