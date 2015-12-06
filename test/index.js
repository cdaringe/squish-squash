test = require('tape');
var ovr = require('../index.js');
var ss = require('child_process').spawnSync;
var fs = require('fs');
var path = require('path');
var dummyCmdPath = './test/testDummyCmd';

var removeDummyCmd = function() {
    try {
        fs.unlinkSync(path.resolve(dummyCmdPath));
    } catch(err) {
        // pass
    }
};
removeDummyCmd();

test('sys cmd override', function(t) {
    var dummyCmd = 'dummyCmd';

    t.throws(function() {
        ovr({
            // squash: dummyCmd,
            syscmd: 'echo'
        });
    }, Error, 'forces squash arg');

    t.throws(function() {
        ovr({
            squash: dummyCmd,
            // syscmd: 'echo'
        });
    }, Error, 'forces syscmd or cmdpath arg');

    var squashingCmd = ovr({
        squash: dummyCmd,
        syscmd: 'echo'
    });
    var result = ss(dummyCmd, ['hello']);
    t.ok(result.stdout.toString().match(/^hello/), 'sys command overriden');
    t.end();

    // @todo - test that dir and dummy cmd removed
});

var userNode = ss('which', ['node']).stdout.toString().match(/.*[a-zA-Z]/)[0];
fs.writeFileSync(dummyCmdPath, [
    '#!' + userNode,
    'console.log(process.argv[2]);'
].join('\n'));

test('cmdpath cmd override', function(t) {
    var dummyCmd2 = 'dummyCmd2';
    var overrideCmd = ovr({
        squash: dummyCmd2,
        cmdpath: path.resolve(dummyCmdPath)
    });
    ss(overrideCmd);
    ss('chmod', ['u+x', dummyCmdPath]);
    var result = ss(dummyCmd2, ['hello2']);
    t.ok(result.stdout.toString().match(/^hello2/), 'cmdpath command overriden');

    removeDummyCmd();
    t.end()
});
