import Taro from '@tarojs/taro'
import cloneDeep from 'lodash.clonedeep'
import PubSub from 'pubsub-js'
import CTX from './_FA'
import _FN from './_FN'
import { $store } from '../store'
import Base64 from './base64'
import anime from '../lib/anime'
import ExpsMap from './ExpsMap'

const PS = PubSub
const warn = console.warn

const SETS = (hid: string) => $store.sets[hid]
const STATE = (hid: string) => SETS(hid).status.filter((state: any) => state.active)[0]
const GET_MODEL =
  (hid: string) =>
  (K: string, E = '$N') => {
    let target = SETS(hid)

    if (!target) {
      warn('target', hid, 'is null')
      return []
    }

    let inner = _FN.SystemModelMap['$' + K]

    if (inner) return inner(hid)

    let model = target.model[K]

    _FN.ModelHandle(hid, K, target)

    if (!model) {
      return []
    }
    return _FN.subExpFilter(E.split(':'), model.value, hid)
  }

const SET_MODEL =
  (hid: string) =>
  (K: string, V: any, E = '$N') => {
  let target = SETS(hid)

  if (!target) return warn(hid, 'is invalid')
  let model = target.model[K]

  if (!model) return;

  // 跳过筛选验证，直接写入
  if (E == 'force') {
    model.value = V
  } else {
    if (Array.isArray(model.value)) {
      _FN.subExpWrite(E.split(':'), model.value, hid, 0, V, model.value, 0)
    } else {
      model.value = V
    }
  }

  PS.publish(`${hid}.$${K}.modelchange`, V)
}

const GET_STATE = hid => (stateName) => {
  let target = SETS(hid)

  if (!target) return

  let state = target.status.filter(state => state.name == stateName)[0]

  if (!state) return

  return {
    ...state.style,
    ...state.custom
  }
}

const SET_STATE = hid => (stateName, obj) => {
  let target = SETS(hid)

  if (!target) return

  let state = target.status.filter(state => state.name == stateName)[0]

  if (!state) return

  for (let key in obj) {
    let sub = obj[key]

    if (state.style.hasOwnProperty(key)) {
      state.style[key] = sub
    } else {
      state.custom[key] = sub
    }
  }
}

const GET_META_STATE = target => target.status.filter(state => state.active && !state.name.includes(':') && state.name != '$mixin')[0]

const TOGGLE_STATE = (hid, stateName) => {
  let target = SETS(hid)

  if (!target) return

  if (stateName.includes(':')) return //只支持元状态

  let state = GET_META_STATE(target)

  if (!state) return

  if (state.name == stateName) return //不能切换到同名状态

  let newState = target.status.filter(state => state.name == stateName)[0]

  if (!newState) return

  state.active = false
  newState.active = true
}

const ACTIVATE_STATE = (hid, subStateName) => {
  let target = SETS(hid)

  if (!target) return

  if (!subStateName.includes(':')) return //只支持子状态

  let state = target.status.filter(state => state.name == subStateName)[0]

  if (!state) return

  state.active = true
}

const FROZEN_STATE = (hid, subStateName) => {
  let target = SETS(hid)

  if (!target) return

  if (!subStateName.includes(':')) return //只支持子状态

  let state = target.status.filter(state => state.name == subStateName)[0]

  if (!state) return

  state.active = false
}

const ROUTE_PUSH = (target, during, transition) => {
  Taro.navigateTo({
    url: '/pages/' + target + '/index',
  })
}

function parseNumberUnit(value) {
  if (value === undefined) return [undefined, '']
  if (typeof value == 'number') return [value, '']
  let V = parseFloat(value)
  return [V, value.replace(String(V), '')]
}

const requestAnimationFrame = function(callback, lastTime) {
  var lastTime;
  if (typeof lastTime === 'undefined') {
      lastTime = 0
  }
  var currTime = new Date().getTime();
  var timeToCall = Math.max(0, 16.7 - (currTime - lastTime))
  lastTime = currTime + timeToCall
  var id = setTimeout(function() {
      callback(currTime + timeToCall, lastTime)
  },
  timeToCall)
  return id
};

const cancelAnimationFrame = function(id) {
  clearTimeout(id)
}

const rafity = (fn, context) => {
  let aid
  let done = false

  function rfn(...arg) {
    if (done) return

    fn(...arg)

    aid = requestAnimationFrame(rfn.bind(context), undefined)
  }

  rfn.done = () => {
    done = true

    cancelAnimationFrame(aid)

    aid = null
  }

  return rfn
}

const ENV = () => {
  return ['mp', Taro.getEnv().toLowerCase()]
}

const TOAST = (msg) => {
  console.log('TOAST:', msg)
}

function parserError(e) {
  let { message, fileName, lineNumber, stack, name } = e

  return { message, fileName, lineNumber, stack, name }
}

let VM

const setVM = (vm: any) => VM = vm
const getVM = () => VM

export default {
  ..._FN,
  ...CTX,
  anime,
  cloneDeep,
  PS: PubSub,
  PS_ID: {},
  SETS,
  STATE,
  SET_MODEL,
  GET_MODEL,
  GET_STATE,
  SET_STATE,
  TOGGLE_STATE,
  ACTIVATE_STATE,
  FROZEN_STATE,
  ROUTE_PUSH,
  GET_META_STATE,
  parseNumberUnit,
  rafity,
  Base64,
  ExpsMap,
  ENV,
  TOAST,
  toast: {
    success: v => window.alert(v),
    error: v => window.alert(v)
  },
  parserError,
  setVM, getVM
}
