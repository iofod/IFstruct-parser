export const URL2Obj = u => {
  return u
    ? Object.assign(
        ...u
          .split('&')
          .filter(e => e)
          .map(e =>
            ((a, b) => ({
              [a]: b
            }))(...e.split('='))
          )
      )
    : {}
}

export const Obj2URL = o => {
  return Object.keys(o)
    .map(e => e + '=' + o[e])
    .join('&')
}

export const getURLconfig = () => URL2Obj(location.hash.match(/([^\?]+)/g)[1])
export const getURLparams = () => URL2Obj(location.search.slice(1))