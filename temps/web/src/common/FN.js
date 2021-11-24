import cloneDeep from 'lodash.clonedeep'
import PubSub from 'pubsub-js'
import _FN from './_FN'
import FLOW from './updateData'

const getLocal = key => JSON.parse(localStorage.getItem(key) || '{}')
const saveLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const removeLocal = key => localStorage.removeItem(key)

const URL2Obj = u => (u ? Object.assign(...u.split('&').filter(e => e).map(e => ((a, b) => ({
  [a]: b
}))(...e.split('=')))) : {})

const Obj2URL = o => Object.keys(o).map(e => e + '=' + o[e]).join('&')

const getURLconfig = () => URL2Obj(location.hash.match(/([^\?]+)/g)[1])
const getURLparams = () => URL2Obj(location.search.slice(1))

function inject(src, tag = 'script', container = 'body') {
  let context = document.createElement(tag)
  context.id = 'i-' + new Date().getTime()
  if (tag === 'link') {
    context.href = src
    context.rel = 'stylesheet'
  } else {
    context.src = src
  }
  document.querySelectorAll(container)[0].appendChild(context)
  return new Promise((resolve, reject) => {
    context.onload = () => resolve(context)
  })
}

const SETS = hid => window.__VM__.$store.state.sets[hid]
const STATE = hid => SETS(hid).status.filter(state => state.active)[0]
const GET_MODEL = hid => (K, E = '$N') => {
  let target = SETS(hid)

  if (!target) {
    warn('target', hid, 'is null')
    return []
  }

  let model = target.model[K]

  FN.ModelHandle(hid, K, target)

  if (!model) {
    return []
  }
  return FN.subExpFilter(E.split(':'), model.value, hid)
}
const SET_MODEL = hid => (K, V, E = '$N') => {
  let target = SETS(hid)

  if (!target) return warn(hid, 'is invalid')
  let model = target.model[K]

  if (E == 'force') {
    window.__VM__.$set(model, 'value', V)
  } else {
    if (Array.isArray(model.value)) {
      FN.subExpWrite(E.split(':'), model.value, hid, 0, V, model.value, 0)
    } else {
      window.__VM__.$set(model, 'value', V)
    }
  }

  FN.PS.publish(`${hid}.$${K}.modelchange`, V)
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
      window.__VM__.$set(state.style, key, sub)
    } else {
      window.__VM__.$set(state.custom, key, sub)
    }
  }
}

const TOGGLE_STATE = (hid, stateName) => {
  let target = SETS(hid)

  if (!target) return

  if (stateName.includes(':')) return

  let state = target.status.filter(state => state.active && !state.name.includes(':'))[0]

  if (!state) return

  if (state.name == stateName) return

  let newState = target.status.filter(state => state.name == stateName)[0]

  if (!newState) return

  state.active = false
  newState.active = true
}

const ACTIVATE_STATE = (hid, subStateName) => {
  let target = SETS(hid)

  if (!target) return

  if (!subStateName.includes(':')) return

  let state = target.status.filter(state => state.name == subStateName)[0]

  if (!state) return

  state.active = true
}

const FROZEN_STATE = (hid, subStateName) => {
  let target = SETS(hid)

  if (!target) return

  if (!subStateName.includes(':')) return

  let state = target.status.filter(state => state.name == subStateName)[0]

  if (!state) return

  state.active = false
}


const ROUTE_PUSH = (target, during = 300, transition = 'fade') => {
  window.FN.PS.publish('Fx_router_change', {
    target,
    during,
    transition
  })
}

function parseNumberUnit(value) {
  if (value === undefined) return [undefined, '']
  if (typeof value == 'number') return [value, '']
  let V = parseFloat(value)
  return [V, value.replace(String(V), '')]
}

const rafity = (fn, context) => {
  let aid = null
  let done = false

  function rfn(...arg) {
    if (done) return

    fn(...arg)

    aid = window.requestAnimationFrame(rfn.bind(context))
  }

  rfn.done = () => {
    done = true

    window.cancelAnimationFrame(aid)

    aid = null
  }

  return rfn
}

function calcUnit(n) {
  return n / 50 + 'rem'
}

function px2any(str, m = ' ') {
  if (str.includes(m)) {
    return str.split(m).map(v => {
      let i = v.indexOf('px')

      return i > 0 ? calcUnit(v.substring(0, i)) : v
    }).join(m)
  } else {
    return calcUnit(str.substring(0, str.length - 2))
  }
}

export default {
  ..._FN,
  getLocal,
  saveLocal,
  removeLocal,
  getURLconfig,
  getURLparams,
  cloneDeep,
  PS: PubSub,
  PS_ID: {},
  inject,
  SETS,
  STATE,
  SET_MODEL,
  GET_MODEL,
  ROUTE_PUSH,
  FLOW,
  GET_STATE,
  SET_STATE,
  TOGGLE_STATE,
  ACTIVATE_STATE,
  FROZEN_STATE,
  parseNumberUnit,
  rafity,
  TOAST: v => window.alert(v),
  toast: {
    success: v => window.alert(v),
    error: v => window.alert(v)
  },
  px2any
}
