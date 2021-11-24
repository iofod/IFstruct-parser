import FN from './FN'
import client from '@tarojs/taro'
import ajax from './ajax'

const SDK = {
  client, // 小程序环境下，client 为 Taro 本身
  GET_MODEL: FN.GET_MODEL,
  SET_MODEL: FN.SET_MODEL,
  FLOW: FN.FLOW,

  GET_STATE: FN.GET_STATE,
  SET_STATE: FN.SET_STATE,
  TOGGLE_STATE: FN.TOGGLE_STATE,
  ACTIVATE_STATE: FN.ACTIVATE_STATE,
  FROZEN_STATE: FN.FROZEN_STATE,

  ROUTE_PUSH: FN.ROUTE_PUSH,
  TOAST: FN.TOAST,
  ENV: FN.ENV,
  AJAX: ajax
}

export default SDK