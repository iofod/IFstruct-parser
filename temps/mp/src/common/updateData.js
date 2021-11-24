import $store from '../store/index'

var FLOW_CACHE = {}
var FLOW_PS = {}


const update = (name, data) => {
  let { id: mid } = $store.state.models[name]

  FLOW_CACHE[mid].next(data)
}


export default update
