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
		.replace('__R__"', '')
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
			fnargs = `FN.parseModelExp('${param}', e.hid, false)`
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
			if (params) {
				let { exp, map } = params

				delete params.exp

				let args = expStringify(params, hid)

				fnexec = `FA.${fn}`
				fnargs = `{...${args}, exp: ($dx, $dy, $x, $y, $ds) => ${exp}${map ? `, map: (RX) => ${map}` : ''}}`
			}

			break
		case 'useInterpolation':
			if (params) {
				let args = expStringify(params, hid)

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
let emitEvent = ['ready', 'change']
let CE_list = [] // Non-native events

const webEvent = ['click']
// longtap is de-compatible by the Gesture definition.
const mpEvent = ['tap', 'longpress', 'touchstart', 'touchmove', 'touchcancel', 'touchend', 'touchforcechange', 'transitionend', 'animationend']

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
		let isWebEvent = webEvent.includes(event)

		if (isWebEvent) {
			switch (event) {
				case 'click':
					event = 'tap'
					
					break
			
				default:
					break
			}
		}
		
		// For events of the same type, conversion to native is preferred.
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
		let isMpEvent = mpEvent.includes(event)

		let useGesture = false

		if (!isMpEvent && isGesture) {
			prefix = `v-GT-${event}`
			useGesture = true
		} else {
			// The rest of the cases follow the user's settings.
			if (event == 'modelchange') {
				prefix = `@${event}`
			} else if (emitEvent.includes(event)) {
				// Change native events that are not supported by the applet to internal $emit triggers.
				prefix = `@${event}`
			} else {
				prefix = `@${event}.native`
			}
		}

		let eventDes = ['passive', 'capture', 'prevent', 'stop', 'self'] //小程序的once需自己实现

		eventDes.forEach(key => {
			if (evo[key]) {
				prefix += '.' + key
			}
		})

		let methodName = `${event}_${hid}`
		let methodMark = methodName

		let mark = cloneMark === `''` ? '' : `, ${cloneMark}` //追加 clone 进去

		if (evo['once']) {
			methodMark = `Once(${methodMark}${mark})`
		}

		if (useGesture) {
			eventMarks.push(`${prefix}="GEV(${methodMark}${mark})"`)
		} else {
			eventMarks.push(`${prefix}="EV($event, ${methodMark}${mark})"`)
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
	return tag
}

exports.genPageContent = (pid, levels, levelTag, levelImport, tree) => {
	return `
<template>
  <view class="page" @touchstart="touchstart" @touchmove="touchmove" @touchend="touchend">
    ${levelTag.join('\n\t\t')}
		<VGlobal hid="Global" :clone="''"></VGlobal>
  </view>
</template>

<script>
import FN from '@common/FN'
import { MouseMixin } from '../../mouse'
${levelImport.join('\n')}
import VGlobal from '../../view/Global.vue'

export default {
	mixins: [MouseMixin],
  components: {
    ${levels.join(',\n\t\t')},
		VGlobal
  },
	created() {
		FN.setContext(this)
	}
}
</script>`
}

exports.genRouteContent = (routes) => {
	return `
exports.router = [
	${routes.join(',\n\t\t')}
]`
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
			lockScroll: false,
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

		if (ui == 'base') {
			ui = 'IF'
		} else {
			// If it is not a base component, the lib prefix is not added,
			// as the requirement itself is self-contained.
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
${childview}
  </${Lmark}>
</template>

<script>
import FN from '@common/FN'
import FA from '@common/FA'
import FX from '@common/FX'
import MF from '@common/MF'
import UT from '@common/UT'

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

const InnerExp = ['$N', '$odd', '$even']

function parseComputedExp(exp) {
	if (typeof exp == 'string' && exp.indexOf('# ') == 0) {
		let expList = exp.match(/\$\w+(-\w+)?(<.+?>)?/g) || []

		expList.forEach((mds) => {
			exp = exp.replace(new RegExp('\\' + mds, 'gm'), `FN.parseModelStr('${mds}', hid)`)
		})

		return `__R__(hid) => ${exp.substr(2)}__R__`
	}
}

exports.genExpsMapContent = () => {
	let expsMap = {}
	let computedMap = {}

	for (let hid in HSS) {
		let target = HSS[hid]

		target.status.forEach(statu => {
			let { name, id, props } = statu
			let { customKeys = {} } = props.option

			for (let ck in customKeys) {
				let cexp = customKeys[ck]
				let cstr = parseComputedExp(cexp)

				if (cstr) {
					computedMap[cexp] = cstr
				}
			}

			if (!name.includes('$')) return

			let nameArr = name.split(':')

			// Proceed to the next step only if a subexpression exists.
			if (nameArr.length < 2) return

			nameArr.slice(1).forEach(exp => {
				let originExp = exp
				//1. Skip independent expressions.
				if (InnerExp.includes(exp)) return
				//2. Substitution of numbers.
				let nreg = exp.match(/\$\d+/g)
				if (nreg) {
					nreg.forEach(md => {
						exp = exp.replace(md, md.substr(1))
					})
				}
				//4. Replaces the model variable expressions.
				let expList = exp.match(/\$([_a-zA-Z]\w+)<*(\w*)>*/g) || []
				expList.forEach((mds) => {
					exp = exp.replace(new RegExp('\\' + mds, 'gm'), `FN.parseModelStr('${mds}', hid)`)
				})

				//3. Replace built-in expressions.
				exp = exp.replace(/(\w+)?\$i(?=\W)/g, '$1_i').replace(/\$i$/, '_i')
				exp = exp.replace(/(\w+)?\$n(?=\W)/g, '$1_n').replace(/\$n$/, '_n')

				expsMap[originExp] = `__R__(_i, _n, hid) => ${exp}__R__`
			})
		})

		let models = target.model

		for (let mk in models) {
			let mexp = models[mk].value
			let mstr = parseComputedExp(mexp)

			if (mstr) {
				computedMap[mexp] = mstr
			}
		}
	}

	return `import FN from './FN'
export default ${JSON.stringify({
	...expsMap,
	...computedMap
}, null, 2).replaceAll('"__R__', '').replaceAll('__R__"', '')}
`
}