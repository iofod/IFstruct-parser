const WebSocket = require('ws')
const getPort = require('get-port')
const inquirer = require('inquirer')
const { applyPatch } = require('rfc6902')
const { error, msg, log } = require('./FN')

let initData
let port
let data
let selected = 'web'

function renderView(cache = true, useRemote = false) {
	initData(JSON.parse(JSON.stringify(data)), cache, selected, useRemote).then((res) => {
    log(res)
    
    console.log('Listen port:', port)
	})
}

const tempHandleMap = {
	web: () => require('./gen_web').initData,
	pcweb: () => require('./gen_web').initData,
	mp: () => require('./gen_mp').initData,
	flutter: () => require('./gen_flutter').initData,
}

async function main(conf) {
	let { temp, useRemote } = conf //web support useRemote params

	if (temp) {
		switch (temp) {
			case 'mp':
			case 'flutter':
			case 'pcweb':
				selected = temp
				initData = tempHandleMap[temp]()
				break
	
			default:
				initData = tempHandleMap.web()
				break
		}
	} else {
		let input = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What type of project is it?',
        default: 'web',
        choices: Object.keys(tempHandleMap).map(k => {
          return {
            name: k,
            value: k
          }
        })
      }
    ])

		selected = input.type
		initData = tempHandleMap[input.type]()
	}

  port = conf.port || await getPort()

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
	
}

exports.sync = main