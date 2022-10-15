export const URL2Obj = (u: any) => {
  if (!u) return {}

  let o = u
    .split('&')
    .filter((e) => e)
    .map((e) => {
      let [a, b] = e.split('=')

      return { [a]: b }
    })
    
  return Object.assign({}, ...o)
}

export const Obj2URL = (o) => {
  return Object.keys(o)
    .map((e) => e + '=' + o[e])
    .join('&')
}

export const getURLconfig = () => {
  let reg = location.hash.match(/([^\?]+)/g)

  return reg ? URL2Obj(reg[1]) : {}
}

export const getURLparams = () => URL2Obj(location.search.slice(1))
