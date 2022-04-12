#!/usr/bin/env node
const path = require('path')
const mri = require('mri')

const Version = 'v1.0.0'

const { error, msg, log } = require('./scripts/FN')
const { create } = require('./scripts/create')
const { sync } = require('./scripts/sync')

const argv = process.argv.slice(2)

let conf = mri(argv, {
  alias: {
    p: 'port',
    v: 'version',
    h: 'help',
    d: 'dir',
    t: 'temp'
  }
})

let sub = conf._
let helpMsg = `usage: iofod [<command> [<args>]
Args:
  -v, --version                              Output the version number
  -h, --help                                 Output usage information
Command:
  create [dir] [temp]                        Create a new project based on the selected template
  listen [port] [temp]                       Add IFstruct change listeners to the created project
  `

function main() {
  if (!sub[0]) {
    if (conf.version) return msg(Version)
    return log(helpMsg)
  }
  
  switch (sub[0]) {
    case 'create':
      log(__dirname, path.resolve('./'))
  
      create(conf)
      break
    case 'listen':
      sync(conf)
        break
  
    default:
      log(helpMsg)
      break
  }
}  

main()