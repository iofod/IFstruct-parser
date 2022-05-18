import { $store } from '../store'
import _FN from './_FN'

const update = (name: string, data) => {
  let { id } = $store.models[name];

  _FN.FLOW_CACHE[id].next(data)
}

export default update