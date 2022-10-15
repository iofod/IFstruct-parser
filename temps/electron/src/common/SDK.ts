import FN from './FN'
import ajax from './ajax'

const SDK = () => ({
  client: window,
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
  ENV: () => ['web'],
  AJAX: ajax,
})

export default SDK
