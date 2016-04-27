'use strict'
const cp = require('child_process')
process.chdir(__dirname)
const r = cp.spawnSync(process.argv[2]) // e.g. => .echo-if-electron
const outStr = r.stdout.toString()
const errStr = r.stderr.toString()
if (r.error) {
  console.error(r.error.message)
  process.exit(1)
}
if (outStr) process.stdout.write(outStr)
if (errStr) process.stderr.write(errStr)
