import Taro from '@tarojs/taro'
import FN from '../../common/FN'
import GV from '../GV/index'
import { dealFlow, dealCaseSteps, getEL } from './helper'
import { $store } from '../../store/index'
import { Icase } from './type'
import { runCasesCallback, createListener } from './connect'
import SDK from '../../common/SDK'
import FA from '../../common/FA'

const Global = $store.history

let cases: Icase[] = []

const log = console.log
const warn = console.warn

async function runGroup(list, context) {
  log('runGroup: ', list)

  for (let conf of list) {
    if (Object.hasOwnProperty.call(conf, 'assert')) {
      let { assert, O, X } = conf

      try {
        // let flag = eval(FN.parseModelExp(assert, 'var', true))
        console.warn('注意:小程序不支持动态执行表达式,表达式:', assert, '永远为真')

        let flag = true
        let sub = flag ? O : X

        log('IF:', assert, flag ? 'O' : 'X')

        await runGroup(sub, context)
      } catch (e) {
        console.warn(e, conf)

        runCasesCallback(GV.RP(5, {
          conf,
          error: {
            ErrorType: 'runGroup',
            message: FN.parserError(e)
          }
        }, 'success'))

        return
      }
    } else {
      let { value } = conf

      let item = cases.filter(obj => obj.id == value)[0]

      if (!item) return

      if (item.type == 'group') {
        let ctx = GV.cloneDeep(item.conf)

        await runGroup(dealFlow(ctx), ctx)
      }

      if (item.type == 'case') {
        await runCase(GV.cloneDeep(item.conf))
      }
    }
  }

  return
}

async function runCase(conf) {
  let { interactionRecord, steps } = conf
  let list = dealCaseSteps(steps)

  log('runCase: ', list)

  if (list.length == 0) return

  Global.interactionRecord = {
    ...Global.interactionRecord, ...interactionRecord
  }

  await GV.sleep(900)
  await runSteps(list)

  return
}

async function runCases(data) {
  Global.useRunCases = true

  if (data.type == 'case') {
    await runCase(GV.cloneDeep(data.conf))
  }

  if (data.type == 'group') {
    let context = GV.cloneDeep(data.conf)
    await runGroup(dealFlow(context), context)
  }

  Global.useRunCases = false

  setTimeout(() => {
    Global.previewCursor.x = -20
    Global.previewCursor.y = -20
  }, 200)

  runCasesCallback(GV.RP(0, 'success'))

  return
}

function setCTX(data) {
  cases = data.cases
}

function proxyEvent(pn) {
  return new Promise<void>((done) => {
    FN.PS.subscribeOnce(pn, () => {
      done()
    })
  })
}

function setDebugCursor({ hid, clone, offset }) {
  let hash = hid + clone.split('|').join('-')

  const query = Taro.createSelectorQuery()

  query.select('.' + hash).boundingClientRect().exec(function(res){
    let target = res[0]

    if (!target) return

    let { left: dx, top: dy } = target
    let cursor = Global.previewCursor

    cursor.x = dx + offset.dx
    cursor.y = dy + offset.dy
    cursor.useTransition = true
  })
}

const MpEVM = {
  click: 'tap',
  pointerdown: 'touchstart',
  pointermove: 'touchmove',
  pointerup: 'touchend',
  pointercancel: 'touchcancel',
  start: 'touchstart',
  end: 'touchend'
}

async function runSteps(list) {
  let i = 0
  try {
    for (let obj of list) {
      if (Array.isArray(obj)) {
        let right = list.slice(i + 1)

        //数组的情况，分组并发，TODO 并发项的 wait 要加上
        await Promise.all([runSteps(obj), runSteps(right)])

        return
      }

      let next = list[i + 1]
      let wait = next ? (next._  - next._pt - obj._) : 1000

      let { hid, event, _wait, pid, context } = obj

      if (_wait) {
        await GV.sleep(_wait)
      }

      let cpid = $store.app.currentPage

      if (cpid != pid) {
        await FA.router({
          target: pid,
          during: 300,
          transition: 'fade',
          replace: false,
          hid
        })

        await GV.sleep(600)
      }

      let { value, clone } = obj
      let el = getEL(hid, clone)

      //补上缺失的属性
      context.target = context.toElement = context.srcElement = el
      context.type = event

      if (!obj.offset) {
        obj.offset = {
          dx: 0, dy: 0
        }
      }

      setDebugCursor(obj)

      Global.previewEventMap[hid] = obj.hash

      await GV.sleep(300)

      if (!FN.SETS(hid)) return warn(hid, 'is invalid')

      switch (event) {
        case 'input [system]':
          SDK.SET_MODEL(hid)('inputValue', value, FN.tfClone(clone))

          break
        case 'change [system]':
          SDK.SET_MODEL(hid)('value', value, FN.tfClone(clone))

          break
        case 'scroll [system]':
          FN.PS.publish('vscrollTo:' + hid + clone, obj.scrollValue)

          await GV.sleep(500)

          break
        default:
          let hash = `${hid}|` + (MpEVM[event] || event)

          FN.PS.publish(hash, obj)

          await Promise.race([
            proxyEvent(`${hash}|success`),
            proxyEvent(`${hash}|fail`),
          ])

          break
      }

      await GV.sleep(Math.min(wait, 3000))

      i++
    }

  } catch (e) {
    console.warn(e, list[i])

    runCasesCallback(GV.RP(5, {
      conf: list[i],
      error: {
        ErrorType: 'runSteps',
        message: FN.parserError(e)
      }
    }, 'success'))

    return
  }

  return
}

const PSTree = {}

function proxyEventHandle(key, fn) {
  let arr = key.split('_')
  let eventName = arr[0]
  let hid = arr.slice(1).join('_')
  let hash = hid + '|' + eventName

  if (PSTree[hash]) return

  PSTree[hash] = FN.PS.subscribe(hash, async(_, data) => {
    let { clone, index, context } = data

    let e = {
      hid: hid,
      ...context,
      context: {
        command: 'RUNNING',
        hid,
        clone,
        index,
        event: context,
        eventName,
        response: null
      }
    }

    if (clone && clone.includes('|')) {
      FN.setCurrentClone(hid, clone)
    }

    e.response = await fn(e)

    FN.PS.publish(hash + '|' + 'success')
  })
}

function wrapProxy(obj) {
  if (process.env.UseAutoTest) {
    for (const key in obj) {
      proxyEventHandle(key, obj[key])
    }
  }
  return obj
}

export { runCases, setCTX, createListener, wrapProxy }
