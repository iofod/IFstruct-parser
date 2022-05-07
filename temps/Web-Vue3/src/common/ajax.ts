const Obj2URL = (o: Object) => {
  return Object.keys(o)
    .map((e) => e + '=' + o[e])
    .join('&')
}

async function ajax(url = '', options: any = {}) {
  let { data, params = {}, responseType = 'text' } = options

  delete options.data
  delete options.params

  if (data) {
    options.body = options.data
  }

  let arg = Obj2URL(params)

  if (arg) {
    url += url.includes('&') ? arg : (url.includes('?') ? '&' : '?') + arg
  }

  try {
    let res = await fetch(url, options)
    let body = await res[responseType]()
    let headers = {}

    res.headers.forEach((V, K) => (headers[K] = V))

    return {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      headers,
      data: body,
    }
  } catch (e) {
    console.error(e)
  }
}

export default ajax
