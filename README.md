# squish-squash

[![Greenkeeper badge](https://badges.greenkeeper.io/cdaringe/squish-squash.svg)](https://greenkeeper.io/)
override a command for for all child processes

<img width="100px" height="100px" src="https://raw.githubusercontent.com/cdaringe/squish-squash/master/img/squash.png"></img>

[ ![Codeship Status for cdaringe/squish-squash](https://codeship.com/projects/c36a2050-7e77-0133-211d-62403764d7f5/status?branch=master)](https://codeship.com/projects/120328)

## install
`npm install squish-squash [--save|--save-dev]`

## example
```js
const ss = require('squish-squash');
// example of squashing system or user cmds with arbitrary command
ss({
    squash: 'node',
    cmdpath: '/path/to/my/other/node/or/Electron'
});

// examples of squashing system or user cmds with system commands
// when any process calls `more`, `less` will actually run
ss({
    squash: 'more',
    syscmd: 'less'
});
// prefer the silver-searcher over grep
ss({
    squash: 'grep',
    syscmd: 'ag'
});
```

## why
Because sometimes you gotta.  Use with caution!

# todo
- [ ] windoze support!  if you know windows, it'd be great to get your input
