/**
 * executes a command string designed to temporarily squash some other command.
 * this is similar to using a bash `alias`, but doesn't modify the user's env,
 * rather just the process' env
 * @ref http://stackoverflow.com/questions/34100700/temporary-alias-a-cmd-to-squash-an-existing-command-then-expire-upon-script-exi
 * @param {object}  opts
 * @param {object}  opts.squash  name of command to squash, e.g. `ls`
 * @param {string=} opts.syscmd  command to squash with, available in the
 *                               existing env. e.g. `ls -al`
 * @param {string=} opts.cmdpath /path/to/binary to use instead of the `squash`ed binary
 */
module.exports = function(opts) {
    if (!opts || typeof opts !== 'object') {
        throw new TypeError('Expected cmd override configuration');
    }
    if (['darwin', 'freebsd', 'linux', 'sunos'].indexOf(process.platform) === -1) {
        throw new Error([
            'Your platform,', process.platform,
            'is not yet supported. We sure want it to be, though!  It hopefully',
            'should be very simple to implement.  See lib/sh-overrider.js, and',
            'write the same tiny tiny script for your platform.  we will merge and',
            'publish promptly!'
        ].join(' '));
    }
    return require('./lib/sh-overrider.js')(opts);
};
