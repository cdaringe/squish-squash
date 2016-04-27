'use strict'

const test = require('tape')
const ss = require('../') // squish-squash!
const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const dummyCmdPath = './test/testDummyCmd'

const spawnSync = (cmd, args) => {
  const r = cp.spawnSync(cmd, args)
  if (r.error) throw err
  if (r.stderr.toString()) {
    console.error(r.stderr.toString())
    process.exit(1)
  }
  return r
}

const removeDummyCmd = function () {
  try { fs.unlinkSync(path.resolve(dummyCmdPath))
  } catch(err) {
    // pass
  }
}
removeDummyCmd()

test('sys cmd override', function (t) {
  const dummyCmd = 'dummyCmd'

  t.throws(function () {
    ss({
      // squash: dummyCmd,
      syscmd: 'echo'
    })
  }, Error, 'forces squash arg')

  t.throws(function () {
    ss({
      squash: dummyCmd,
    // syscmd: 'echo'
    })
  }, Error, 'forces syscmd or cmdpath arg')

  const squashingCmd = ss({
    squash: dummyCmd,
    syscmd: 'echo'
  })
  const result = spawnSync(dummyCmd, ['hello'])
  t.ok(result.stdout.toString().match(/^hello/), 'sys command overriden')
  t.end()
})

test('cmdpath cmd override', function (t) {
  const userNode = spawnSync('which', ['node']).stdout.toString().match(/.*[a-zA-Z]/)[0]
  fs.writeFileSync(dummyCmdPath, [
    '#!' + userNode,
    'console.log(process.argv[2])'
  ].join('\n'))
  const dummyCmd2 = 'dummyCmd2'
  const overrideCmd = ss({
    squash: dummyCmd2,
    cmdpath: path.resolve(dummyCmdPath)
  })
  spawnSync('chmod', ['u+x', dummyCmdPath])
  const result = spawnSync(dummyCmd2, ['hello2'])
  t.ok(result.stdout.toString().match(/^hello2/), 'cmdpath command overriden')

  removeDummyCmd()
  t.end()
})

test('squashing node works with #! scripts', function (t) {
  const runCpCmd = path.resolve(__dirname, './.run-cp-cmd.js')
  const processHinter = path.resolve(__dirname, './.process-hinter')
  spawnSync('chmod', ['u+x', runCpCmd])
  spawnSync('chmod', ['u+x', processHinter])
  let result = spawnSync('node', [runCpCmd, processHinter])

  // assert that the process-hinter echos back our current versions.modules, pre-squash
  t.equals(
    result.stdout.toString(),
    process.versions.modules,
    'non-electron node logs its versions'
  )

  // prep for electron node squash!
  process.env.ATOM_SHELL_INTERNAL_RUN_AS_NODE = '1'
  const overrideCmd = ss({
    squash: 'node',
    cmdpath: path.resolve(__dirname, '../node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron')
  })

  // run electron node against a process which will call another cp mandating
  // interpreting via #!/usr/bin/env node
  // assert that the process-hinter indicates we are using electron in #!...
  result = spawnSync('node', [runCpCmd, processHinter])
  t.equals(result.stdout.toString(), 'ELECTRON_ASAR', 'electron node logs nothing electron asar id')
  delete process.env.ATOM_SHELL_INTERNAL_RUN_AS_NODE
  t.end()
})
