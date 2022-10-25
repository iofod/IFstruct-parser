import PS from 'pubsub-js'
import _FN from './_FN'
import FLOW from './updateData'
import GV from '../lib/GV'
import { $store } from '../store'
import Toast from 'lb-toast'
import 'lb-toast/dist/index.css'

window.alert = (str) => Toast.info(typeof str == 'string' ? str : JSON.stringify(str))

const SETS = (hid: string) => $store.sets[hid]
const STATE = (hid: string) => SETS(hid).status.filter((state: any) => state.active)[0]
const GET_MODEL =
  (hid: string) =>
  (K: string, E = '$N') => {
    let target = SETS(hid)

    if (!target) {
      console.warn('target', hid, 'is null')
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

    if (!target) return console.warn(hid, 'is invalid')
    let model = target.model[K]

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

const GET_STATE = (hid: string) => (stateName: string) => {
  let target = SETS(hid)

  if (!target) return

  let state = target.status.filter((state: any) => state.name == stateName)[0]

  if (!state) return

  return {
    ...state.style,
    ...state.custom,
  }
}

const SET_STATE = (hid: string) => (stateName: string, obj: any) => {
  let target = SETS(hid)

  if (!target) return

  let state = target.status.filter((state) => state.name == stateName)[0]

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

const TOGGLE_STATE = (hid: string, stateName: string) => {
  let target = SETS(hid)

  if (!target) return

  if (stateName.includes(':')) return

  let state = GET_META_STATE(target)

  if (!state) return

  if (state.name == stateName) return

  let newState = target.status.filter((state) => state.name == stateName)[0]

  if (!newState) return

  state.active = false
  newState.active = true
}

const ACTIVATE_STATE = (hid: string, subStateName: string) => {
  let target = SETS(hid)

  if (!target) return

  if (!subStateName.includes(':')) return

  let state = target.status.filter((state) => state.name == subStateName)[0]

  if (!state) return

  state.active = true
}

const FROZEN_STATE = (hid: string, subStateName: string) => {
  let target = SETS(hid)

  if (!target) return

  if (!subStateName.includes(':')) return

  let state = target.status.filter((state) => state.name == subStateName)[0]

  if (!state) return

  state.active = false
}

const ROUTE_PUSH = (target: string, during = 300, transition = 'fade') => {
  if ($store.app.currentPage == target) return

  PS.publish('Fx_router_change', {
    target,
    during,
    transition,
  })
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
  PS,
  PS_ID: {},
  inject: GV.inject,
  SETS,
  STATE,
  SET_MODEL,
  GET_MODEL,
  ROUTE_PUSH,
  FLOW,
  GET_STATE,
  SET_STATE,
  TOGGLE_STATE,
  GET_META_STATE,
  ACTIVATE_STATE,
  FROZEN_STATE,
  Toast,
  TOAST: (v: string) => (window as any).alert(v),
  toast: {
    success: (v: string) => (window as any).alert(v),
    error: (v: string) => (window as any).alert(v),
  },
  parserError,
  setVM, getVM
}
