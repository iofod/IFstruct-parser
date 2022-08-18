/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs'
import path from 'path'
import WebSocket from 'ws'
import getPort from 'get-port'
import { applyPatch } from 'rfc6902'
import { error, log } from './common/FN'

let initData
let port
let data
let projectType
let selected

function renderView(cache = true, useRemote = false) {
  initData(JSON.parse(JSON.stringify(data)), {
    cache,
    projectType,
    selected,
    useRemote,
  }).then((res) => {
    log(res)

    console.log('Listen port:', port)
  })
}

function isExist(name) {
  return fs.existsSync(path.resolve(`./${name}`))
}

const TempsMap = {
  web: () => require('./web/gen_web').initData,
  pcweb: () => require('./web/gen_web').initData,
  mp: () => require('./mp/gen_mp').initData,
  flutter: () => require('./flutter/gen_flutter').initData,
}

async function main(conf) {
  const { useRemote } = conf //web support useRemote params

  if (isExist(`pubspec.yaml`)) {
    projectType = selected = 'flutter'
    initData = TempsMap.flutter()
  } else if (isExist('package.json')) {
    const json = require(path.resolve(`./package.json`))

    if (!json.template)
      return error('The current project is not a valid iofod project')

    if (json.template.includes('Web')) {
      if (json.template.includes('PC')) {
        projectType = 'pcweb'
      } else {
        projectType = 'web'
      }

      selected = json.template
    }

    if (json.template.includes('Taro')) {
      projectType = selected = 'mp'
    }
  } else {
    return error('The current project type cannot be recognized')
  }

  initData = TempsMap[projectType]()
  port = conf.port || (await getPort())

  console.log('Listen port:', port)

  const wss = new WebSocket.Server({ port })

  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      try {
        const obj = JSON.parse(message)

        if (obj.type == 'ALL') {
          data = obj.payload

          renderView(false, useRemote)
        }
        if (obj.type == 'OT') {
          const ot = obj.payload

          log(ot)

          applyPatch(data, ot)

          renderView(true, useRemote)
        }
      } catch (e) {
        console.error(e)
      }
    })
  })

  wss.on('error', (e) => {
    console.error(e)
  })
}

export { main as sync }
