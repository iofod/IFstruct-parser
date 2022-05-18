window.FLOW_CACHE = {}
window.FLOW_PS = {}

const update = (name, data) => {
  let { id: mid } = window.__VM__.$store.state.models[name]

  FLOW_CACHE[mid].next(data)
}

export default update