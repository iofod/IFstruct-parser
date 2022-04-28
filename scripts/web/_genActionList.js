

const { diffState, genExp, parseExclude, writeResponseList } = require('../common/helper')
const { IF } = require('./_env')

let useCommand = false
const useCommandList = []

function expStringify(params, hid, jumpKeys = []) {
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
			if (param && IF.ctx.Fx[param]) {
				let { key, dir = '' } = IF.ctx.Fx[param]
				let road = dir.split('/').join('.')

				fnexec = `FX${road}.${key}`
				fnargs = `e.context`
			}
			break
		case 'service':
			if (param && IF.ctx.MF[param]) {
				let { key, dir } = IF.ctx.MF[param]

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

			let curr = IF.ctx.HSS[hid]
			let currState = IF.ctx.getActiveMetaState(hid)

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

			let origin = IF.ctx.HSS[target]

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

exports.genActionList = genActionList