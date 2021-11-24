const { getCloneMark, diffState, parseExclude, writeResponseList } = require('./helper')

let HSS
let TB
let FX
let MF
let UT
let mainPage
let data
let pages

function genExp(exp, prefix = 'FN.parseModelStr', suffix = '') {
	let expList = exp.match(/\$\w+(-\w+)?(<.+?>)?/g) || []

	expList.forEach((mds) => {
		// The $response in the expression uses the variable directly.
		if (mds == '$response') {
			exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${mds.substr(1)}`)
		} else {
			exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${prefix}('\\${mds}', e.hid)${suffix}`)
		}
	})

	return exp
}

exports.initTemp = function (payload) {
	data = payload
	pages = data.CTT.T.pages
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


const heroCP = {}

const expStringify = (params, hid, jumpKeys = []) => {
	for (let attr in params) {
		let value = params[attr]

		if (!jumpKeys.includes(attr) && typeof value == 'string' && value != '$current' && value.slice(0, 1) === '$' && parseExclude.filter(v => value.includes(v)).length<1) {
			params[attr] = `__R__parseModelStr('${value}', e.hid)__R__`
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

	if (params) {
		params.context = '__R__e.context__R__'
	}

	switch (fn) {
		case 'function':
			if (param && FX[param]) {
				let { key, dir = '' } = FX[param]
				let road = dir ? dir.substr(1).split('/').map(v => `['${v}']`).join('') : ''

				fnexec = `FX${road}['${key}']`
				fnargs = `e.context`
			}
			break
		case 'service':
			if (param && MF[param]) {
				let { key, dir } = MF[param]

				if (!dir) {
					dir = ''
				}
				let road = dir ? dir.substr(1).split('/').map(v => `['${v}']`).join('') : ''

				fnexec = `MF${road}['${key}']`
				fnargs = `e.context`
			}
			break
		case 'getIndex':
			fnexec = `FA.getIndex`
			fnargs = `e.context`
			break
		case 'alert':
			fnexec = `FA.${fn}`
			fnargs = `parseModelExp('${param.replace(/\$/g, '\\$').replace('\\$response', '$response')}', e.hid, false)`
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
				delete params.map

				let args = expStringify(params, hid)

				fnexec = `FA.${fn}`
				fnargs = `{...${args}, "exp": (dx, dy, x, y, ds) => evalJS('''${exp}''')${map ? `, "map": (RX) => ${map}` : ''}}`
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
				if (heroCP[hid]) {
					if (!heroCP[hid].includes(params.tag)) {
						heroCP[hid].push(params.tag)
					}
				} else {
					heroCP[hid] = [params.tag]
				}

				let args = expStringify(params, hid)

				fnexec = `FA.${fn}`
				fnargs = `{...${args}, "clone": e.context.clone }`
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

			exp = genExp(exp, '${parseModelStr', '}')

			let tmp = `
      if (evalJS('''${exp}''')) {
        ${genActionList(hid, O, []).join('\n')}
      } else {
        ${genActionList(hid, X, []).join('\n')}
      }
      `

			list.push(tmp)
		} else if (fn == 'loopAssert') {
			// while
			let { exp, O } = action

			exp = genExp(exp, '${parseModelStr', '}')

			useCommandList.push(useCommand)
			useCommand = true

			let tmp = `
      var mark = await whileAsync(() => (evalJS('''${exp}''')), (command) async {
        ${genActionList(hid, O, []).join('\n')}
      });

      if (mark == 'RETURN') return;
      `

			list.push(tmp)

			useCommand = useCommandList.pop()
		} else if (fn == 'applyActions') {
			let { target, fromEvent } = action.params

			target == '$current' ? hid : target

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
        return command('${param.toUpperCase()}');
        `
			} else {
				tmp = `return '${param.toUpperCase()}';`
			}

			list.push(tmp)

			return
		} else {
			let { fnexec, fnargs } = getExec(fn, params, param, hid)

			if (!fnexec || !fnargs) return console.log('gen invalid: ', fn, params, param, hid)

			if (fn == 'getModel' || fn == 'getIndex') {
				let fragment = `await ` + fnexec + `(` + fnargs + `);`
				let nextAction = actionArr[I + 1]
				// If the next action is function/service, you need to write e.context.
				if (nextAction) {
					fragment = 'response = ' + fragment
					if (writeResponseList.includes(nextAction.fn)) {
						fragment += '\ne.context.response = response;'
					}
				}

				list.push(fragment)
			} else if (writeResponseList.includes(fn)) {
				let fragment = `await ` + fnexec + `(` + fnargs + `);`
				let nextAction = actionArr[I + 1]

				if (nextAction && JSON.stringify(nextAction).includes('$response') && !writeResponseList.includes(nextAction.fn)) {
					fragment = 'response = ' + fragment
				}

				list.push(fragment)
			} else {
				list.push(`await ` + fnexec + `(` + fnargs + `);`)
			}
		}
	})
	return list
}

let customEvent = []
let CE_list = [] // Non-native events

function genEventContent(hid, events, cloneMark, jumpCE = true) {
	let eventMethods = []

	events.forEach((evo) => {
		if (jumpCE && customEvent.includes(evo.event)) {
			evo.hid = hid
			CE_list.push(evo)
			return
		}

		// If the evo carries an hid, it takes precedence, since the evo at this point originates from the CE_list.
		hid = evo.hid || hid

		let { event, actions, native, mds } = evo

		// Similar events are prioritized for conversion to native.
		switch (event) {
			case 'start':
				event = 'touchstart'
				
				break
			case 'end':
				event = 'touchend'
				
				break
			case 'modelchange':
				event += ('_' + mds.substr(1))
				break
		
			default:
				break
		}

		let methodName = `${hid}$$${event}`

		let execBody = genActionList(hid, actions)

		let acStr = JSON.stringify(actions)
		let use$Response = acStr.includes('$response') || acStr.includes('function') || acStr.includes('service')

		let methodBody = `Future ${methodName}(e) async {
		${use$Response ? 'var response;\n' : ''}${execBody.join('\n')}
	}`

		eventMethods.push(methodBody)
	})

	return {
		eventMethods
		/**
     * eventMarks: [@click.native="click_xccc", @touchstart.native="touchstart_xxx"]
     * eventMethods: [async xxx() {}, async xxx() {}]
     * 
     */
	}
}

exports.genPageContent = (pid) => {
	return `
import 'package:flutter/material.dart';
import '../common/mixin.dart';
import '../store/index.dart';
import '../common/initView.dart';

class P${pid} extends StatefulWidget {
	P${pid}({Key key, this.title, this.pid, this.path }) : super(key: key);

	final String title;
	final String pid;
	final String path;

	@override
	_P${pid}State createState() => _P${pid}State(pid, path);
}


class _P${pid}State extends State<P${pid}> {
	final String pid;
	final String path;
	_P${pid}State(this.pid, this.path);
	@override
	Widget build(BuildContext context) {
		var deviceData = MediaQuery.of(context);

		setUnit(deviceData.size);

		initStore('${pid}');
		setContext('${pid}', context);

		return Scaffold(body: Container(
      constraints: BoxConstraints.expand(),
			color: $bg,
			child: Stack(
				children: initView('${pid}')
		)));
	}
}

`
}

exports.genRouteContent = (routes) => {
	let main = mainPage || 'index'
	let tree = HSS[main]

	routes.push({
    dep: ``,
    ctx: `"/": (context, params) => PinitPage(title: '${tree.name}', root: P${main}(title: '${tree.name}', pid: '${main}', path: '/'))`
  })

	return `import 'package:fluro/fluro.dart';
${routes.map(obj => obj.dep).join('\n')}
import './common/vrouter.dart';
import './initPage.dart';

final routes = {
  ${routes.map(obj => obj.ctx).join(',\n\t')}
};

final router = FluroRouter();
final $router = Router(router);

createRouter() {
  routes.forEach((path, route) {
    router.define(path, handler: Handler(handlerFunc: route));
  });
}`
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

exports.genStoreContent = () => {
	let model = {}

	for (let mid in TB) {
		let obj = TB[mid]
		model[obj.key] = {
			id: mid,
			subscriber: obj.subscriber
		}
	}

	let mstr = JSON.stringify(model, null, 2).replace(/\$/g, '\\$')
	
	let config = {}
	let hero = {}

	let tree = {}

	const setStore = hid => {
		traveSets(hid, (hid, target) => {
			let obj = {
				...target
			}

			delete obj.remarks

			tree[hid] = obj
		})
	}

	data.CTT.T.pages.forEach((pid) => {
		let tags = {}
		let hasTag = false

		// The tags of each page are independent of each other, i.e., 
		// they can be unique within a page, but not between pages.
		// The best practice is to keep it globally unique.
		traveSets(pid, (hid, target) => {
			let tag = target.model.tag

			if (tag) {
				hasTag = true

				let vid = tag.value

				if (vid) {
					tags[vid] = hid

					hero[hid] = vid
				}
			}
		})

		if (hasTag) {
			config[pid] = tags
		}

		setStore(pid)
	})

	setStore('Global')

	let cfstr = JSON.stringify(data.Config.setting, null, 2).replace(/\$/g, '\\$')

	let hsstr = JSON.stringify(tree, null, 2).replace(/\$/g, '\\$')
	let heroStr = JSON.stringify(hero, null, 2).replace(/\$/g, '\\$')
	let heroCPStr = JSON.stringify(heroCP, null, 2).replace(/\$/g, '\\$')

	return `
import 'dart:convert';

var projectTree = jsonDecode('''${hsstr}
''');
var projectModel = jsonDecode('''${mstr}
''');
var projectConfig = jsonDecode('''${cfstr}
''');
var heroTagsMap = jsonDecode('''${heroStr}
''');
var heroCP = jsonDecode('''${heroCPStr}
''');

`
}

// Map iofod events to the flutter event system.
const flutterEVM = {
	'tap': 'onTap',
	'click': 'onTap',
	'swipe': 'onTap',
	'longtap': 'onLongPress',
	'touchstart': 'onPanDown',
	'touchmove': 'onPanUpdate',
	'touchend': 'onPanEnd',
	'touchcancel': 'onPanCancel'
}

function calcEVM(id, events) {
	let m = {}

	events.forEach(event => {
		let mdm = event.mds ? ('##' + `${event.mds.substr(1)}`) : ''
		let obj = {
			fn: `__R__${id}$$${event.event + (event.mds ? ('_' + event.mds.substr(1)) : '')}__R__`,
		}

		let eventDes = ['passive', 'once', 'prevent', 'stop', 'self']

		eventDes.forEach(key => {
			if (event[key]) {
				obj[key] = true
			}
		})

		m[(flutterEVM[event.event] || event.event) + mdm] = obj
	})

	return m
}

exports.genEVContent = () => {
	let eventContent = []

	const genChildView = (hid, IN = '', DI = 0) => {
		let tree = HSS
		let target = tree[hid]

		let { content, type, model, events, name, remarks } = target

		let CM_arr = getCloneMark(DI)
		let CM = CM_arr.join(" + '|' + ")

		CM = DI > 0 ? "'|' + " + CM : "''" //   clone=""  clone="|I|J"   clone mark =>  '|' + [I, J].join('|') => |I|J

		let isMirror = content == 'base/mirror'
		let { eventMethods } = genEventContent(hid, events, CM)

		eventContent.push(...eventMethods)

		if (isMirror) {
			// mirror only supports zero-dimensional values at compile time, 
			// so there is no need to consider the multidimensional case.
			let uv = target.model.use.value

			if (tree[uv]) {
				genChildView(uv, IN, DI)
			} 
		} else {
			if (target.children && target.children.length) {
				target.children.map((id) => genChildView(id, IN, DI))
			}
		}

		let evDict = calcEVM(hid, HSS[hid].events)

		if (Object.keys(evDict).length > 0) {
			evMap[hid] = evDict
		}
	}

	let evMap = {}
	let list = [...pages]

	list.push('Global')

	list.forEach(pid => {
		HSS[pid].children.forEach(id => {
			let { eventMethods } = genEventContent(id, HSS[id].events, 'clone')
	
			eventContent.push(...eventMethods)

			HSS[id].children.map((cid) => genChildView(cid, '\t', 0))

			let evDict = calcEVM(id, HSS[id].events)

			if (Object.keys(evDict).length > 0) {
				evMap[id] = evDict
			}
		})
	})


	//============= Global =================
	let { eventMethods } = genEventContent('Global', HSS['Global'].events, 'clone')

	eventContent.push(...eventMethods)

	let evDict = calcEVM('Global', HSS['Global'].events)

	if (Object.keys(evDict).length > 0) {
		evMap['Global'] = evDict
	}
	//======================================

	// The elements of clone need to be de-duplicated.
	eventContent = [ ...new Set(eventContent) ].join('\n\n')

	return `import '../common/FA.dart';
import '../common/FX.dart';
import '../common/FN.dart';
import '../common/MF.dart';

${eventContent}

final eventMap = ${JSON.stringify(evMap, null, 2).replaceAll('"__R__', '').replaceAll('__R__"', '')};
`
}

exports.genScriptContent = (key, id, value, useWindow = false) => {
	//Replace the function body with the convention mode.
	let str = value.replace(/next\(\)/g, 'callBridge("$token")').replace(/next\(/g, 'callBridge("$token", ')

	return `
Future ${id}(data, next) async {
	String token = GV.uuid();

  PS.subscribeOnce('JS:$token', next);

	evalJS('''
  (async(data) => {
	${str}
	})(\${data.toString()})
	''');
}
`
}

exports.genScriptDeps = (prefix, ids, dict, namespace, useWindow = false) => {
	let injectDeps = ids.map((id) => {
		let { dir, key } = dict[id]

		return `import './${prefix}${dir || ''}/${key}.dart';`
	})

	let roadMap = {}
	let jsRoadMap = {}

	ids.map((id) => {
		let { dir, key } = dict[id]

		let p = roadMap
		let q = jsRoadMap
		let arr = dir ? dir.split('/').filter((e) => e) : []

		// Generate Catalog
		arr.forEach((d) => {
			p[d] = p[d] || {}
			q[d] = q[d] || {}
			p = p[d]
			q = q[d]
		})

		p[key] = `__R___${namespace}['${id}']__R__`
		q[key] = `__R__${namespace}.${id}__R__`
	})

	let body = `
import './FA.dart';
	`

	let idMap = ids.map(id => `"${id}": ${id}`).join(',\n')

	if (useWindow) {
		body = `
const UT = {
	${ids.map(id => `${id}(data) {\n$${id}\n}`).join(',\n')}
}
		`
	return `
import './FN.dart';
${injectDeps.join('\n')}
initUT() {
	evalJS('''
	${body} 
	window.UT = ${JSON.stringify(jsRoadMap, null, 2).replaceAll('"__R__', '').replaceAll('__R__"', '')}
	''');
}
		`
	} else {
		body += `
final _${namespace} = FA.promisify({
	${idMap}
});
`
	return `
	${injectDeps.join('\n')}
	${body} 
	final ${namespace} = ${JSON.stringify(roadMap, null, 2).replaceAll('"__R__', '').replaceAll('__R__"', '')};
	`

	}
}
