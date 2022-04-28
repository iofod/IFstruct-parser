const { getCloneMark, diffState, parseExclude, genExp, DIMap, writeResponseList, Gesture } = require('./helper')

let HSS
let TB
let FX
let MF
let UT
let mainPage
let data

exports.initTemp = function (payload) {
	data = payload
	HSS = data.CTT.T.HSS
	
	TB = data.Models.table
	FX = data.Models.Fx
	MF = data.Models.MF
	UT = data.Models.util

	mainPage = data.Config.setting.mainPage
}

const getActiveMetaState = (hid) => {
	let target = HSS[hid]

	return target.status.filter((state) => !state.name.includes(':') && state.active)[0]
}


const expStringify = (params, hid, jumpKeys = []) => {
	for (let attr in params) {
		let value = params[attr]

		if (!jumpKeys.includes(attr) && typeof value == 'string' && value != '$current' && value.slice(0, 1) === '$' && parseExclude.filter(v => value.includes(v)).length<1) {
			params[attr] = `__R__FN.parseModelStr('${value}', e.hid)__R__`
		}
	}
	return JSON.stringify(params, null, 2)
	.replace(/\$current/g, hid)
		.split('\n').join('\n\t\t\t')
		.replace('"__R__', '')
		.replace('__R__"', '') // 替换掉填充字
}

function getExec(fn, params, param, hid) {
	let fnexec = ''
	let fnargs = ''

	switch (fn) {
		case 'function':
			if (param && FX[param]) {
				let { key, dir = '' } = FX[param]
				let road = dir.split('/').join('.')

				fnexec = `FX${road}.${key}`
				fnargs = `e.context`
			}
			break
		case 'service':
			if (param && MF[param]) {
				let { key, dir } = MF[param]

				if (!dir) {
					dir = ''
				}
				let road = dir.split('/').join('.')

				fnexec = `MF${road}.${key}`
				fnargs = `e.context`
			}
			break
		case 'getIndex':
			fnexec = `FA.getIndex`
			fnargs = `e.context`
			break
		case 'alert':
			fnexec = `FA.${fn}`
			fnargs = `FN.parseModelExp("${param}", e.hid, false)`
			break
		case 'routerGo':
		case 'timeout':
			fnexec = `FA.${fn}`
			fnargs = `${param}`
			break
		case 'animate':
			fnexec = `FA.animate`

			let curr = HSS[hid]
			let currState = getActiveMetaState(hid)

			params.frames = params.frames.map((id) => {
				let state = curr.status.filter((statu) => statu.id === id)[0]
				let changed = diffState(currState, state)

				currState = state

				return changed
			})

			let args = expStringify(params, hid)
			fnargs = `${args}`

			break
		case 'useInteractionFlow':
		case 'useInterpolation':
			if (params) {
				let args = expStringify(params, hid, ['exp'])

				fnexec = `FA.${fn}`
				fnargs = `${args}`
			}

			break
		
		case 'setCPA':
			if (params) {
				let args = expStringify(params, hid)

				fnexec = `FA.${fn}`
				fnargs = `{...${args}, clone: e.context.clone }`
			}
			
			break

		default:
			if (params) {
				let args = expStringify(params, hid)

				fnexec = `FA.${fn}`
				fnargs = `${args}`
			}
			break
	}

	// The substitution of expressions is performed first.
	fnargs = fnargs.replace(/: "(.*?)\$response(.*?)"/g, ': $1response$2')
	// Global replacement of response in intermediate processes.
	fnargs = fnargs.replace(/"\$response"/g, 'response')

	return {
		fnexec,
		fnargs
	}
}

let useCommand = false
const useCommandList = []

function genActionList(hid, actions, list = []) {
	let actionArr = actions.filter(action => action.active)
	actionArr.forEach((action, I) => {
		let { fn, active, params, param } = action

		if (!active) return

		if (fn == 'assert') {
			let { exp, O, X } = action

			exp = genExp(exp)

			let tmp = `
      if (${exp}) {
        ${genActionList(hid, O, []).join('\n')}
      } else {
        ${genActionList(hid, X, []).join('\n')}
      }
      `

			list.push(tmp)
		} else if (fn == 'loopAssert') {
			// while
			let { exp, O } = action

			exp = genExp(exp)

			useCommandList.push(useCommand)
			useCommand = true

			let tmp = `
      let mark = await whileAsync(() => (${exp}), async(command) => {
        ${genActionList(hid, O, []).join('\n')}
      })

      if (mark == 'RETURN') return
      `

			list.push(tmp)

			useCommand = useCommandList.pop()
		} else if (fn == 'applyActions') {
			let { target, fromEvent } = action.params

			target = target == '$current' ? hid : target

			let origin = HSS[target]

			if (!origin) return console.warn('applyActions fail:', target, fromEvent)

			let event = origin.events.filter(ev => ev.event == fromEvent)[0] || {}
			let quote = event.actions || []
			let tmp = `${genActionList(hid, quote, []).join('\n')}`

			list.push(tmp)
		} else if (fn == 'ended') {
			// break|continue|return
			let tmp

			if (useCommand) {
				tmp = `
        return command('${param.toUpperCase()}')
        `
			} else {
				tmp = `return '${param.toUpperCase()}'`
			}

			list.push(tmp)

			return
		} else {
			let { fnexec, fnargs } = getExec(fn, params, param, hid)

			if (!fnexec || !fnargs) return console.log('gen invalid: ', fn, params, param, hid)

			if (fn == 'getModel' || fn == 'getIndex') {
				let fragment = `await ` + fnexec + `(` + fnargs + `)`
				let nextAction = actionArr[I + 1]
				// If the next action is function/service, you need to write e.context.
				if (nextAction) {
					fragment = 'response = ' + fragment
					if (writeResponseList.includes(nextAction.fn)) {
						fragment += '\ne.context.response = response'
					}
				}

				list.push(fragment)
			} else if (writeResponseList.includes(fn)) {
				let fragment = `await ` + fnexec + `(` + fnargs + `)`
				let nextAction = actionArr[I + 1]

				if (nextAction && JSON.stringify(nextAction).includes('$response') && !writeResponseList.includes(nextAction.fn)) {
					fragment = 'response = ' + fragment
				}

				list.push(fragment)
			} else {
				list.push(`await ` + fnexec + `(` + fnargs + `)`)
			}
		}
	})
	return list
}

let customEvent = ['routechange', 'modelchange']
let CE_list = [] // Non-native events

function genEventContent(hid, events, cloneMark, jumpCE = true) {
	let eventMarks = []
	let eventMethods = []

	events.forEach((evo) => {
		if (jumpCE && customEvent.includes(evo.event)) {
			evo.hid = hid
			CE_list.push(evo)
			return
		}

		hid = evo.hid || hid

		let { event, actions, native } = evo

		let prefix

		switch (event) {
			case 'start':
				event = 'touchstart'
				
				break
			case 'end':
				event = 'touchend'
				
				break
		
			default:
				break
		}

		let isGesture = Gesture.includes(event)

		if (isGesture) {
			prefix = `v-GT-${event}`
		} else {
			prefix = `@${event}${native === false ? '' : '.native'}`
		}

		['passive', 'capture', 'once', 'prevent', 'stop', 'self'].forEach(key => {
			if (evo[key]) {
				prefix += '.' + key
			}
		})

		let methodName = `${event}_${hid}`
		let mark = cloneMark === `''` ? '' : `, ${cloneMark}`

		if (isGesture) {
			eventMarks.push(`${prefix}="GEV(${methodName}${mark})"`)
		} else {
			eventMarks.push(`${prefix}="EV($event, ${methodName}${mark})"`)
		}

		let execBody = genActionList(hid, actions)

		let acStr = JSON.stringify(actions)
		let use$Response = acStr.includes('$response') || acStr.includes('function') || acStr.includes('service')

		let methodBody = `async ${methodName}(e) {
      ${use$Response ? 'let response\n' : ''}${execBody.join('\n')}
    }`

		eventMethods.push(methodBody)
	})

	return {
		eventMarks,
		eventMethods
		/**
     * eventMarks: [@click.native="click_xccc", @touchstart.native="touchstart_xxx"]
     * eventMethods: [async xxx() {}, async xxx() {}]
     */
	}
}

function genTag(hid, tag) {
	let flag = HSS[hid].status.filter(statu => statu.props.option.IAA || statu.props.option.IAA).length

	return flag ? 'A' + tag : tag
}

exports.genPageContent = (pid, levels, levelTag, levelImport, tree) => {
	return `
<template>
  <div class="page">
    ${levelTag.join('\n\t\t')}
  </div>
</template>

<script>
import FN from '../common/FN'
${levelImport.join('\n')}

FN.PS.publish('updatePage', { tree: ${JSON.stringify(tree, null, 2)}, pid: "${pid}"})

export default {
  components: {
    ${levels.join(',\n\t\t')}
  }
}
</script>`
}

exports.genRouteContent = (routes) => {
	return `
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
		${routes.join(',\n\t\t')},
    { path: '/', redirect: '/${mainPage}' }
  ]
})`
}

function traveSets(hid, callback) {
	let target = HSS[hid]

	callback(hid, target)

	if (target && target.children && target.children.length) {
		target.children.forEach((id) => {
			traveSets(id, callback)
		})
	}
}

exports.genStoreContent = (appid, tree) => {
	let str = JSON.stringify(
		Object.assign(
			{
				padding: {
					status: [
						{
							name: 'default',
							id: 'default',
							style: [],
							custom: {},
							active: true
						}
					],
					model: {}
				}
			},
			tree
		),
		null,
		2
	)
		.split('\n')
		.join('\n')

	let model = {}

	for (let mid in TB) {
		let obj = TB[mid]
		model[obj.key] = {
			id: mid,
			subscriber: obj.subscriber
		}
	}

	let mstr = JSON.stringify(model, null, 2)

	let config = {}

	data.CTT.T.pages.forEach((pid) => {
		let tags = {}
		let hasTag = false

		traveSets(pid, (hid, target) => {
			let tag = target.model.tag

			if (tag) {
				hasTag = true

				let vid = tag.value

				if (vid) {
					tags[vid] = hid
				}
			}
		})

		if (hasTag) {
			config[pid] = tags
		}
	})

	let cfstr = JSON.stringify(config, null, 2)

	return `
export default {
  state: {
    app: {
      appid: '${appid}',
      currentPage: '${mainPage}',
    },
    sets: ${str},
    history: {
      past: [],
      current: {
        target: '${mainPage}',
        during: 500,
        transition: 'fade',
        timestamp: 0
      },
      future: [],
      heroTagsMap: ${cfstr},
      currentTags: {},
      returnTags: {}, 
		},
		models: ${mstr}
  },
}
`
}

exports.genViewContent = (lid, tree) => {
	let eventContent = []
	const genChildView = (hid, IN = '', DI = 0) => {
		let target = tree[hid] //|| HSS[hid]

		let { content, type, model, events, name, remarks } = target

		let [ ui, cname ] = content.split('/')
		let getTag

		// 内置系统UI的别名
		if (ui == 'base') {
			ui = 'IF'
		} else {
			ui = ''
		}

		let hasCopy = false

		if (model.hasOwnProperty('copy')) {
			hasCopy = true
			DI += 1
		} else {
			hasCopy = false
		}

		let LM = DIMap[DI] // loop mark
		let CM_arr = getCloneMark(DI)
		let CM = CM_arr.join(" + '|' + ")

		CM = DI > 0 ? "'|' + " + CM : "''" //   clone=""  clone="|I|J"   clone mark =>  '|' + [I, J].join('|') => |I|J

		let str
		let isMirror = content == 'base/mirror'

		let cloneMark = CM != "''" ? ` :clone="${CM}"` : ``

		const tag = genTag(hid, `${ui}${cname}`)

		let { eventMarks, eventMethods } = genEventContent(hid, events, CM)

		eventContent.push(...eventMethods)

		const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : '' //eventBinding

		let CID = DI > 1 ? `'${hid + "', " + CM_arr.slice(0, CM_arr.length - 1).join(', ')}` : `'${hid}'` // copy 比普通的 model 小一个维度，所以这里判定条件为 1

		if (type == 'unit' && !isMirror) {
			let unitHead = `${IN}\t<${tag} class="U-unit" hid="${hid}"${EBD}`

			if (hasCopy) {
				str = `${unitHead} v-for="(_, ${LM}) in CID(${CID})" :key="'${hid}' + ${CM}"${cloneMark}></${tag}>`
			} else {
				str = `${unitHead}${cloneMark}></${tag}>`
			}
		} else {
			// container or mirror
			IN += '\t'

			let inject = isMirror ? ' class="U-unit"' : ''
			let wrapHead = `${IN}<${tag}${inject} hid="${hid}"${EBD}`

			if (hasCopy) {
				getTag = (v) => `${wrapHead} v-for="(_, ${LM}) in CID(${CID})" :key="'${hid}' + ${CM}"${cloneMark}>${v}</${tag}>`
			} else {
				getTag = (v) => `${wrapHead}${cloneMark}>${v}</${tag}>`
			}

			if (isMirror) {
				let uv = target.model.use.value

				if (tree[uv]) {
					str = getTag(`${IN}\n` + genChildView(uv, IN, DI) + `\n${IN}`)
				} else {
					str = getTag(``)
				}
			} else {
				// container
				let comment = ``
				// 去掉默认值
				if (name != '容器' && name != 'container') {
					let rtxt = ` `
					if (remarks) {
						remarks = remarks.split('\n').join(`\n${IN}`)
						rtxt = ` : \n${IN}${remarks}\n${IN}`
					}
					comment = `${IN}<!-- ${name}${rtxt}-->\n`
				}
				if (target.children && target.children.length) {
					str =
						`${comment}` +
						getTag(target.children.map((id, index) => `\n` + genChildView(id, IN, DI)).join('') + `\n${IN}`)
				} else {
					str = `${comment}` + getTag(``)
				}
			}
		}

		return str
	}

	let childview = tree[lid].children.map((cid, index) => genChildView(cid, '\t', 0)).join('\n')

	let { eventMarks, eventMethods } = genEventContent(lid, tree[lid].events, 'clone')

	eventContent.push(...eventMethods)

	const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : '' //eventBinding

	eventContent = [ ...new Set(eventContent) ].join(',')

	let readyContent = []

	let created = ``

	const genCreated = () => {
		if (!CE_list.length) return

		let { eventMarks, eventMethods } = genEventContent(lid, CE_list, 'clone', false)

		let genStr = str => `
		created() {
			${str}
		},`

		let str = ``
		let unstr = ``

		CE_list.forEach((evo, I) => {

			let { hid, event, mds, target, once } = evo

			let subscriber = once ? 'FN.PS.subscribeOnce' : 'FN.PS.subscribe'

			let fn_name = eventMethods[I].replace('async', 'async function')
			let sub_name = event == 'modelchange' ? `${target || hid}.${mds}.${event}` : event

			str += `
			FN.PS.unsubscribe(FN.PS_ID.${hid}_${event})
			FN.PS_ID.${hid}_${event} = ${subscriber}('${sub_name}', this.GEV(${fn_name}))`

			unstr += ``
		})

		created = genStr(str)

		CE_list = []
	}

	genCreated()

	let Lmark = genTag(lid, 'IFlevel')

	return `<template>
  <${Lmark} class="wrap" hid="${lid}" :clone="clone" :style="STYLE"${EBD}>
  <div class="frame" :style="LAYOUT">
${childview}
  </div>
  </${Lmark}>
</template>

<script>
import FA from '../common/FA'
import FX from '../common/FX'
import MF from '../common/MF'

export default {${created}
  methods: {
    ${eventContent}
	},
	mounted() {
		${readyContent}
	}
}
</script>  
`
}

exports.genScriptDeps = (prefix, ids, dict, namespace, useWindow = false) => {
	let injectDeps = ids.map((id) => {
		let { dir, key } = dict[id]

		return `import ${id} from './${prefix}${dir || ''}/${key}' `
	})

	let roadMap = {}

	ids.map((id) => {
		let { dir, key } = dict[id]

		let p = roadMap
		let arr = dir ? dir.split('/').filter((e) => e) : []

		arr.forEach((d) => {
			p[d] = p[d] || {}
			p = p[d]
		})

		p[key] = `__R__${namespace}.${id}__R__`
	})

	let body = `
	
	`

	if (useWindow) {
		body += `
const ${namespace} = {
	${ids.join(',\n')}
}
`
	} else {
		body += `
import FA from './FA'

const ${namespace} = {
	...FA.promisify({
		${ids.join(',\n')}
	})
}
`
	}

	return `
${injectDeps.join('\n')}
${body} 
export default ${JSON.stringify(roadMap, null, 2).replaceAll('"__R__', '').replaceAll('__R__"', '')}
`
}
