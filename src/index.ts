#!/usr/bin/env node
import path from 'path'
import mri from 'mri'
const Version = 'v1.3.0'

import { msg, log, error } from './common/FN'
import { create } from './create'
import { sync } from './sync'
import { auto } from './auto'

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
  auto                                       Set up an automated test server
  `

function main() {
  if (!sub[0]) {
    if (conf.version) return msg(Version)
    return log(helpMsg)
  }

  if (typeof String.prototype.replaceAll != 'function') return error('Your version of Node.js needs to be upgraded to v16.15.0 or above.')

  switch (sub[0]) {
    case 'create':
      log(__dirname, path.resolve('./'))

      create(conf)
      break
    case 'listen':
      sync(conf)
      break

    case 'auto':
      auto(conf)
      break

    default:
      log(helpMsg)
      break
  }
}

main()
