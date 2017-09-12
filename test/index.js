'use strict'

require('perish')
const test = require('ava')
const ss = require('../') // squish-squash!
const cp = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const execa = require('execa')

test('sys cmd override', async t => {
  const dummyCmd = 'dummyCmd'
  t.throws(() => ss({ syscmd: 'echo' }), Error, 'forces squash arg')
  t.throws(() => ss({ squash: dummyCmd }), Error, 'forces syscmd or cmdpath arg')
  const squashingCmd = ss({
    squash: dummyCmd,
    syscmd: 'echo'
  })
  const result = await execa(dummyCmd, ['hello'])
  t.truthy(result.stdout.toString().match(/^hello/), 'sys command overriden')
})

test('cmdpath cmd override', async t => {
  function removeDummyCmd () {
    try {
      fs.unlinkSync(path.resolve(dummyCmdPath))
    } catch(err) {
      /* pass */
    }
  }
  const dummyCmdPath = './test/testDummyCmd'
  await removeDummyCmd()
  let { stdout: whichStdout } = await execa('which', ['node'])
  const userNode = whichStdout.toString().match(/.*[a-zA-Z]/)[0]
  const dummyScript = `#!${userNode}\nconsole.log(process.argv[2])`
  await fs.writeFile(dummyCmdPath, dummyScript)
  const dummyCmd2 = 'dummyCmd2'
  const overrideCmd = ss({
    squash: dummyCmd2,
    cmdpath: path.resolve(dummyCmdPath)
  })
  await execa('chmod', ['u+x', dummyCmdPath])
  let { stdout: dummyCmd2Stdout } = await execa(dummyCmd2, ['hello2'])
  t.truthy(dummyCmd2Stdout.toString().match(/^hello2/), 'cmdpath command overriden')
  await removeDummyCmd()
})

test.only('squashing node works with #! scripts', async t => {
  const runCpCmd = path.resolve(__dirname, './scaffolding/child-process-runner.js')
  const processHinter = path.resolve(__dirname, './scaffolding/process-hinter')
  await execa('chmod', ['u+x', runCpCmd])
  await execa('chmod', ['u+x', processHinter])
  let result = await execa('node', [runCpCmd, processHinter])

  // assert that the process-hinter echos back our current versions.modules, pre-squash
  t.is(
    result.stdout.toString(),
    process.versions.modules,
    'non-electron node logs its versions'
  )

  // prep for electron node squash!
  process.env.ELECTRON_RUN_AS_NODE = '1'
  const cmdpath = path.resolve(__dirname, '../node_modules/.bin/electron')
  const overrideCmd = ss({
    squash: 'node',
    cmdpath
  })
  const squashedCmdDir = path.dirname(overrideCmd.target)
  t.is(process.env.PATH.indexOf(squashedCmdDir), 0, 'squashed node is first in PATH')
  const { stdout: whichNodeStdout } = await execa.shell('which node -a', { env: Object.assign({}, process.env) })
  t.is(whichNodeStdout.toString().indexOf(overrideCmd.target), 0, 'which reports squashed node')

  // run electron node against a process which will call another cp mandating
  // interpreting via #!/usr/bin/env node
  // assert that the process-hinter indicates we are using electron in #!...
  result = await execa('node', [runCpCmd, processHinter])
  t.is(result.stdout.toString(), 'ELECTRON_ASAR', 'electron node logs electron asar id')
  delete process.env.ELECTRON_RUN_AS_NODE
})
