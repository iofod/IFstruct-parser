const Obj2URL = o => {
  return Object.keys(o)
    .map(e => e + '=' + o[e])
    .join('&')
}

async function ajax(url, options = {}) {
  let { data, params = {}, responseType = 'text' } = options

  delete options.data
  delete options.params

  if (data) {
    options.body = options.data
  }
  
  let arg = Obj2URL(params)

  if (arg) {
    url += url.includes('&') ? arg : ((url.includes('?') ? '&' : '?') + arg)
  }

  try {
    let res = await fetch(url, options)
    let body = await res[responseType]()
    let header = {}

    res.headers.forEach((V, K) => header[K] = V)

    return {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      header,
      data: body
    }
  } catch (e) {
    console.error(e)
  }
}

SDK.ajax = ajax