import Taro from '@tarojs/taro'

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
    let { method } = options
    let res = await Taro.request({
      url, data, header: options.headers || {}, method,
      responseType, dataType: responseType
    })

    return {
      url: url,
      status: res.statusCode,
      statusText: res.errMsg,
      headers: res.header,
      data: res.data
    }
  } catch (e) {
    console.error(e)
  }
}

export default ajax