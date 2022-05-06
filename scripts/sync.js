const fs = require('fs')
const path = require('path')
const WebSocket = require('ws')
const getPort = require('get-port')
const inquirer = require('inquirer')
const { applyPatch } = require('rfc6902')
const { msg, log } = require('./common/FN')

let initData
let port
let data
let selected = 'web'

function renderView(cache = true, useRemote = false) {
  initData(JSON.parse(JSON.stringify(data)), { cache, selected, useRemote }).then((res) => {
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

async function getInquirer() {
  let input = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What type of project is it?',
      default: 'web',
      choices: Object.keys(TempsMap).map((k) => {
        return {
          name: k,
          value: k,
        }
      }),
    },
  ])

  return input
}

async function main(conf) {
  let { temp, useRemote } = conf //web support useRemote params

  if (temp) {
    switch (temp) {
      case 'mp':
      case 'flutter':
      case 'pcweb':
        selected = temp
        initData = TempsMap[temp]()
        break

      default:
        initData = TempsMap.web()
        break
    }
  } else {
    if (isExist(`pubspec.yaml`)) {
      selected = 'flutter'
      initData = TempsMap.flutter()
    } else if (isExist('package.json')) {
      let json = require(path.resolve(`./package.json`))

      if (!json.template) {
        let input = await getInquirer()
  
        selected = input.type
      }

      if (json.template.includes('Web')) {
        if (json.template.includes('PC')) {
          selected = 'pcweb'
        } else {
          selected = 'web'
        }
      }

      if (json.template.includes('Taro')) {
        selected = 'mp'
      }

    } else {
      let input = await getInquirer()
  
      selected = input.type
    }
  }

  initData = TempsMap[selected]()

  port = conf.port || (await getPort())

  console.log('Listen port:', port)

  const wss = new WebSocket.Server({ port })

  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      try {
        let obj = JSON.parse(message)

        if (obj.type == 'ALL') {
          data = obj.payload

          renderView(false, useRemote)
        }
        if (obj.type == 'OT') {
          let ot = obj.payload

          log(ot)

          applyPatch(data, ot)

          renderView(true, useRemote)
        }
      } catch (e) {
        console.error(e)
      }
    })
  })

  wss.on('error', e => {
    console.error(e)
  })
}

exports.sync = main
