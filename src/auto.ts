/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs'
import path from 'path'
import WebSocket from 'ws'
import { error } from './common/FN'

let projectType
let port

const autoPortMap = {
  web: 5210,
  pcweb: 5210,
  mp: 5211,
  flutter: 5212,
}

function isExist(name) {
  return fs.existsSync(path.resolve(`./${name}`))
}

async function main(conf) {
  if (isExist(`pubspec.yaml`)) {
    projectType = 'flutter'
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
    }

    if (json.template.includes('Taro')) {
      projectType = 'mp'
    }
  } else {
    return error('The current project type cannot be recognized')
  }

  port = conf.port || autoPortMap[projectType]

  console.log('Listen port:', port)

  const wss = new WebSocket.Server({ port })

  wss.on('connection', function connection(client, req) {
    const { headers } = req
    const cid = headers['sec-websocket-key']

    client.cid = cid
    client.on('message', function incoming(message) {
      try {
        const obj = JSON.parse(message)

        if (obj.type == 'INIT_AUTO') {
          client.isEditor = true
        }
        if (obj.type == 'START_AUTO') {
          const receivers = Array.from(wss.clients).filter(
            (c) => (c as any).isEditor != true
          )

          if (!receivers.length) return

          receivers.forEach((receiver) => {
            ;(receiver as any).send(
              JSON.stringify({
                type: 'START_AUTO',
                payload: obj.payload,
              })
            )
          })
        }

        if (obj.type == 'CALLBACK') {
          const editor = Array.from(wss.clients).filter(
            (c) => (c as any).isEditor == true
          )[0]

          if (!editor) return
          ;(editor as any).send(
            JSON.stringify({
              type: 'CALLBACK',
              payload: obj.payload,
            })
          )
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

export { main as auto }
