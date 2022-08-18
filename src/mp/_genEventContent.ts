/* eslint-disable no-case-declarations */
/* eslint-disable prefer-const */
import {
  diffState,
  genExp,
  writeResponseList,
  Gesture,
  parseExclude,
  processReplacement,
} from '../common/helper'
import { IF } from './_env'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CE_list: any = [] // Non-native events

const expStringify = (params, hid, jumpKeys: string[] = []) => {
  for (const attr in params) {
    const value = params[attr]

    if (
      !jumpKeys.includes(attr) &&
      typeof value == 'string' &&
      value != '$current' &&
      value.slice(0, 1) === '$' &&
      parseExclude.filter((v) => value.includes(v)).length < 1
    ) {
      params[attr] = `__R__FN.parseModelStr('${value}', e.hid)__R__`
    }
  }

  return processReplacement(JSON.stringify(params, null, 2), hid)
}

function getExec(fn, params, param, hid) {
  let fnexec = ''
  let fnargs = ''

  switch (fn) {
    case 'function':
      if (param && IF.ctx.Fx[param]) {
        const { key, dir = '' } = IF.ctx.Fx[param]
        const road = dir.split('/').join('.')

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
        const road = dir.split('/').join('.')

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

        const args = expStringify(params, hid)

        fnexec = `FA.${fn}`
        fnargs = `{...${args}, exp: ($dx, $dy, $x, $y, $ds) => ${exp}${
          map ? `, map: (RX) => ${map}` : ''
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
        const args = expStringify(params, hid)

        fnexec = `FA.${fn}`
        fnargs = `{...${args}, clone: e.context.clone }`
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

  if (fn == 'setModel') {
    fnargs = genExp(fnargs)
  }

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

      exp = genExp(exp)

      const tmp = `
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

      const tmp = `
      let mark = await FA.whileAsync(() => (${exp}), async(command) => {
        ${genActionList(hid, O, []).join('\n')}
      })

      if (mark == 'RETURN') return
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
        return command('${param.toUpperCase()}')
        `
      } else {
        tmp = `return '${param.toUpperCase()}'`
      }

      list.push(tmp)

      return
    } else {
      const { fnexec, fnargs } = getExec(fn, params, param, hid)

      if (!fnexec || !fnargs)
        return console.log('gen invalid: ', fn, params, param, hid)

      if (fn == 'getModel' || fn == 'getIndex') {
        let fragment = `await ` + fnexec + `(` + fnargs + `)`
        const nextAction = actionArr[I + 1]
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
        list.push(`await ` + fnexec + `(` + fnargs + `)`)
      }
    }
  })
  return list
}

const customEvent = ['routechange', 'modelchange']
const emitEvent = ['ready', 'change']

const webEvent = [
  'click',
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
]
// longtap is de-compatible by the Gesture definition.
const mpEvent = [
  'tap',
  'longpress',
  'touchstart',
  'touchmove',
  'touchcancel',
  'touchend',
  'touchforcechange',
  'transitionend',
  'animationend',
]

function genEventContent(hid, events, cloneMark, jumpCE = true) {
  const eventMarks: string[] = []
  const eventMethods: string[] = []

  events.forEach((evo) => {
    if (jumpCE && customEvent.includes(evo.event)) {
      evo.hid = hid
      CE_list.push(evo)
      return
    }

    hid = evo.hid || hid

    let { event, actions } = evo

    let prefix
    const isWebEvent = webEvent.includes(event)

    if (isWebEvent) {
      switch (event) {
        case 'click':
          event = 'tap'

          break
        case 'pointerdown':
          event = 'touchstart'

          break
        case 'pointermove':
          event = 'touchmove'

          break
        case 'pointerup':
          event = 'touchend'

          break
        case 'pointercancel':
          event = 'touchcancel'

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

    const isGesture = Gesture.includes(event)
    const isMpEvent = mpEvent.includes(event)

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
        prefix = `@${event}`
      }
    }

    const eventDes = ['passive', 'capture', 'prevent', 'stop', 'self'] //小程序的once需自己实现

    eventDes.forEach((key) => {
      if (evo[key]) {
        prefix += '.' + key
      }
    })

    const methodName = `${event}_${hid}`
    let methodMark = methodName

    const mark = cloneMark === `''` ? '' : `, ${cloneMark}` //追加 clone 进去

    if (evo['once']) {
      methodMark = `Once(${methodMark}${mark})`
    }

    if (useGesture) {
      eventMarks.push(`${prefix}="GEV(${methodMark}${mark})"`)
    } else {
      eventMarks.push(`${prefix}="EV($event, ${methodMark}${mark})"`)
    }

    const execBody = genActionList(hid, actions)

    const acStr = JSON.stringify(actions)
    const use$Response =
      acStr.includes('$response') ||
      acStr.includes('function') ||
      acStr.includes('service')

    const methodBody = `async ${methodName}(e) {
      ${use$Response ? 'let response\n' : ''}${execBody.join('\n')}
    }`

    eventMethods.push(methodBody)
  })

  return {
    eventMarks,
    eventMethods,
    /**
     * eventMarks: [@click.native="click_xccc", @touchstart.native="touchstart_xxx"]
     * eventMethods: [async xxx() {}, async xxx() {}]
     */
  }
}

export { genEventContent, CE_list }
