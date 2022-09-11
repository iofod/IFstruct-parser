/* eslint-disable no-case-declarations */
/* eslint-disable prefer-const */
import { writeResponseList, diffState } from '../common/helper'
import { expStringify, genExp, heroCP, genEvalStr } from './_helper'
import { IF } from './_env'

function getExec(fn, params, param, hid) {
  let fnexec = ''
  let fnargs = ''

  if (params) params.context = '__R__e.context__R__'

  if (params) {
    params.hid = hid
  }

  const FX = IF.ctx.Fx
  const MF = IF.ctx.MF

  switch (fn) {
    case 'function':
      if (param && FX[param]) {
        const { key, dir = '' } = FX[param]
        const road = dir
          ? dir
              .substring(1)
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

        const road = dir
          ? dir
              .substring(1)
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

      const curr = IF.ctx.HSS[hid]
      let currState = IF.ctx.getActiveMetaState(hid)

      params.frames = params.frames.map((id) => {
        const state = curr.status.filter((statu) => statu.id === id)[0]
        const changed = diffState(currState, state)

        currState = state

        return changed
      })

      const args = expStringify(params, hid)
      fnargs = `${args}`

      break
    case 'useInteractionFlow':
      if (params) {
        const { exp, map } = params

        delete params.exp
        delete params.map

        const args = expStringify(params, hid)

        fnexec = `FA.${fn}`
        fnargs = `{...${args}, "exp": (dx, dy, x, y, ds) => ${genEvalStr(exp)}${
          map ? `, "map": (RX) => ${map}` : ''
        }}`
      }

      break
    case 'useInterpolation':
      if (params) {
        const args = expStringify(params, hid)

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

        const args = expStringify(params, hid)

        fnexec = `FA.${fn}`
        fnargs = `{...${args}, "clone": e.context.clone }`
      }

      break
    case 'setModel':
      if (params) {
        const copyParams = { ...params }
        const oldValue = copyParams.value
        const flag = typeof oldValue == 'string' && oldValue

        if (flag) {
          copyParams.value = `__R__evalJS(||||${oldValue.replaceAll(
            '$response',
            '${Executable(response)}'
          )}||||)__R__`
        }

        // params.value: replace  $ to /$
        let args = expStringify(copyParams, hid)

        if (flag) {
          args = genExp(args, '${parseModelExp', '}')
        }

        fnexec = `FA.${fn}`
        fnargs = `${args.replaceAll(`||||`, `'`)}`
      }

      break
    default:
      if (params) {
        const args = expStringify(params, hid)

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
const useCommandList: boolean[] = []

function genActionList(hid, actions, list: string[] = []) {
  const actionArr = actions.filter((action) => action.active)

  actionArr.forEach((action, I) => {
    const { fn, active, params, param } = action

    if (!active) return

    if (fn == 'assert') {
      let { exp, O, X } = action

      exp = genExp(exp, '${parseModelExp', '}')

      const tmp = `
      if (${genEvalStr(exp)}) {
        ${genActionList(hid, O, []).join('\n')}
      } else {
        ${genActionList(hid, X, []).join('\n')}
      }
      `

      list.push(tmp)
    } else if (fn == 'loopAssert') {
      // while
      let { exp, O } = action

      exp = genExp(exp, '${parseModelExp', '}')

      useCommandList.push(useCommand)
      useCommand = true

      const tmp = `
      var mark = await FA.whileAsync(() => (${genEvalStr(
        exp
      )}), (command) async {
        ${genActionList(hid, O, []).join('\n')}
      });

      if (mark == 'RETURN') return;
      `

      list.push(tmp)

      useCommand = useCommandList.pop() || false
    } else if (fn == 'applyActions') {
      let { target, fromEvent } = action.params

      target = target == '$current' ? hid : target

      const origin = IF.ctx.HSS[target]

      if (!origin) return console.warn('applyActions fail:', target, fromEvent)

      const event = origin.events.filter((ev) => ev.event == fromEvent)[0] || {}
      const quote = event.actions || []
      const tmp = `${genActionList(hid, quote, []).join('\n')}`

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
      const { fnexec, fnargs } = getExec(fn, params, param, hid)

      if (!fnexec || !fnargs)
        return console.log('gen invalid: ', fn, params, param, hid)

      if (fn == 'getModel' || fn == 'getIndex') {
        let fragment = `await ` + fnexec + `(` + fnargs + `);`
        const nextAction = actionArr[I + 1]
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
        const nextAction = actionArr[I + 1]

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

const customEvent: string[] = []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CE_list: any = [] // Non-native events

function genEventContent(hid, events, _cloneMark, jumpCE = true) {
  const eventMethods: string[] = []

  events.forEach((evo) => {
    if (jumpCE && customEvent.includes(evo.event)) {
      evo.hid = hid
      CE_list.push(evo)
      return
    }

    // If the evo carries an hid, it takes precedence, since the evo at this point originates from the CE_list.
    hid = evo.hid || hid

    let { event, actions, mds } = evo

    // Similar events are prioritized for conversion to native.
    switch (event) {
      case 'start':
        event = 'touchstart'

        break
      case 'end':
        event = 'touchend'

        break
      case 'modelchange':
        event += '_' + mds.substring(1)
        break

      default:
        break
    }

    const methodName = `${hid}$$${event}`
    const execBody = genActionList(hid, actions)
    const acStr = JSON.stringify(actions)
    const use$Response =
      acStr.includes('$response') ||
      acStr.includes('function') ||
      acStr.includes('service') ||
      acStr.includes('${response}')
    const methodBody = `Future ${methodName}(e) async {
		${use$Response ? 'var response;\n' : ''}${execBody.join('\n')}
	}`

    eventMethods.push(methodBody)
  })

  return {
    eventMethods,
  }
}

export { genEventContent }
