const { writeResponseList, diffState } = require('../common/helper')
const { expStringify, genExp, heroCP } = require('./_helper')
const { IF } = require('./_env')

function getExec(fn, params, param, hid) {
  let fnexec = ''
  let fnargs = ''

  if (params) params.context = '__R__e.context__R__'

  let FX = IF.ctx.Fx
  let MF = IF.ctx.MF

  switch (fn) {
    case 'function':
      if (param && FX[param]) {
        let { key, dir = '' } = FX[param]
        let road = dir
          ? dir
              .substr(1)
              .split('/')
              .map((v) => `['${v}']`)
              .join('')
          : ''

        fnexec = `FX${road}['${key}']`
        fnargs = `e.context`
      }
      break
    case 'service':
      if (param && MF[param]) {
        let { key, dir } = MF[param]

        if (!dir) dir = ''

        let road = dir
          ? dir
              .substr(1)
              .split('/')
              .map((v) => `['${v}']`)
              .join('')
          : ''

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
      fnargs = `parseModelExp('${param
        .replace(/\$/g, '\\$')
        .replace('\\$response', '$response')}', e.hid, false)`
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
      if (params) {
        let { exp, map } = params

        delete params.exp
        delete params.map

        let args = expStringify(params, hid)

        fnexec = `FA.${fn}`
        fnargs = `{...${args}, "exp": (dx, dy, x, y, ds) => evalJS('''${exp}''')${
          map ? `, "map": (RX) => ${map}` : ''
        }}`
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
    fnargs,
  }
}

let useCommand = false
const useCommandList = []

function genActionList(hid, actions, list = []) {
  let actionArr = actions.filter((action) => action.active)

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
      var mark = await FA.whileAsync(() => (evalJS('''${exp}''')), (command) async {
        ${genActionList(hid, O, []).join('\n')}
      });

      if (mark == 'RETURN') return;
      `

      list.push(tmp)

      useCommand = useCommandList.pop()
    } else if (fn == 'applyActions') {
      let { target, fromEvent } = action.params

      target = target == '$current' ? hid : target

      let origin = IF.ctx.HSS[target]

      if (!origin) return console.warn('applyActions fail:', target, fromEvent)

      let event = origin.events.filter((ev) => ev.event == fromEvent)[0] || {}
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

        if (
          nextAction &&
          JSON.stringify(nextAction).includes('$response') &&
          !writeResponseList.includes(nextAction.fn)
        ) {
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
        event += '_' + mds.substr(1)
        break

      default:
        break
    }

    let methodName = `${hid}$$${event}`
    let execBody = genActionList(hid, actions)
    let acStr = JSON.stringify(actions)
    let use$Response =
      acStr.includes('$response') || acStr.includes('function') || acStr.includes('service')
    let methodBody = `Future ${methodName}(e) async {
		${use$Response ? 'var response;\n' : ''}${execBody.join('\n')}
	}`

    eventMethods.push(methodBody)
  })

  return {
    eventMethods
  }
}

exports.genEventContent = genEventContent
