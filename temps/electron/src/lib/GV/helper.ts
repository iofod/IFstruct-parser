export const warn = (...arg) => console.warn(...arg)
export const log = (...arg) => console.log(...arg)

export const sleep = (time = 1000) => new Promise((resolve) => setTimeout(resolve, time))
export const throttle = (delay, action) => {
  let last = 0
  return function () {
    let curr = +new Date()
    if (curr - last > delay) {
      action.apply(this, arguments)
      last = curr
    }
  }
}

export const RP = (type, res, msg = '') => {
  if (type != 0) {
    warn(type, res, msg)
  }
  if (res == undefined) {
    res = {}
  }
  if (typeof res == 'string') {
    msg = res
    res = {}
  }
  return {
    code: type,
    msg: msg,
    data: res,
  }
}

export function inject(src = '', tag = 'script', container = 'body') {
  let context: any = document.createElement(tag)
  
  context.id = 'i-' + Date.now()

  if (tag === 'link') {
    context.href = src
    context.rel = 'stylesheet'
  } else {
    context.src = src
  }

  document.querySelectorAll(container)[0].appendChild(context)

  return new Promise((resolve) => {
    context.onload = () => resolve(context)
  })
}

export function styleInject(css) {
  if (!css || typeof document === 'undefined') return
  let head = document.head || document.getElementsByTagName('head')[0]
  let style: any = document.createElement('style')
  style.type = 'text/css'

  head.appendChild(style)

  if (style.styleSheet) {
    style.styleSheet.cssText = css
  } else {
    style.appendChild(document.createTextNode(css))
  }
}

export const uuid = () => {
  const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4()
}

export const randomStr = () => {
  return Math.random().toString(36).substr(2)
}

export const T = (b = 13) => (b == 13 ? Date.now() : Math.round(Date.now() / 1000))
