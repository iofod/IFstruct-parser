#!/usr/bin/env node
import path from 'path'
import mri from 'mri'
const Version = 'v1.2.1'

import { msg, log } from './common/FN'
import { create } from './create'
import { sync } from './sync'

const argv = process.argv.slice(2)

const conf = mri(argv, {
  alias: {
    p: 'port',
    v: 'version',
    h: 'help',
    d: 'dir',
    t: 'temp',
  },
})

const sub = conf._
const helpMsg = `usage: iofod [<command> [<args>]
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
