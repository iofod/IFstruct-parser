import './FN.dart';
import 'js/pubsub-js.dart';

final console = isWeb
    ? ('var log = (...arg) => console.log(...arg)')
    : ('''
var window = {}
var console = {
  log: (...arg) => arg.forEach(msg => log(msg))
}
''');

const bridgeSDK = '''
const callBridge = function(token, payload) {
  bridgeExec('JS:', JSON.stringify({
    token, payload
  }))
}

window.callBridge = callBridge

const SDK = {
  client: {},
  GET_MODEL(hid) {
    return (K, E) => {
      return bridgeExec('CC:', JSON.stringify({
        method: 'GET_MODEL',
        payload: { hid, key: K, exp: E }
      }))
    }
  },
  SET_MODEL(hid) {
    return (K, V, E) => {
      bridgeExec('CC:', JSON.stringify({
        method: 'SET_MODEL',
        payload: { hid, key: K, value: V, exp: E }
      }))
    }
  },
  FLOW(table, data) {
    return bridgeExec('CC:', JSON.stringify({
      method: 'FLOW',
      payload: { table, data }
    }))
  },
  GET_STATE(hid) {
    return (stateName) => {
      return JSON.parse(bridgeExec('CC:', JSON.stringify({
        method: 'GET_STATE',
        payload: { hid, stateName }
      })))
    }
  },
  SET_STATE(hid) {
    return (stateName, obj) => {
      return bridgeExec('CC:', JSON.stringify({
        method: 'SET_STATE',
        payload: { hid, stateName, obj }
      }))
    }
  },
  TOGGLE_STATE(hid, stateName) {
    return bridgeExec('CC:', JSON.stringify({
      method: 'TOGGLE_STATE',
      payload: { hid, stateName }
    }))
  },
  ACTIVATE_STATE(hid, subStateName) {
    return bridgeExec('CC:', JSON.stringify({
      method: 'ACTIVATE_STATE',
      payload: { hid, subStateName }
    }))
  },
  FROZEN_STATE(hid, subStateName) {
    return bridgeExec('CC:', JSON.stringify({
      method: 'FROZEN_STATE',
      payload: { hid, subStateName }
    }))
  },
  ROUTE_PUSH(target, during, transition) {
    return bridgeExec('CC:', JSON.stringify({
      method: 'ROUTE_PUSH',
      payload: { target, during, transition }
    }))
  },
  TOAST(message) {
    return bridgeExec('CC:', JSON.stringify({
      method: 'TOAST',
      payload: { message }
    }))
  },
  ENV() {
    return bridgeExec('CC:', JSON.stringify({
      method: 'ENV',
      payload: { }
    }))
  }
}
window.SDK = SDK

const uuid = () => {
  const S4 = () =>
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  return (
    S4() +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    S4() +
    S4()
  )
}

$pubsubjs

window.PS = window.PubSub
''';


final innerSDK = '''
$console

$bridgeSDK
''';
