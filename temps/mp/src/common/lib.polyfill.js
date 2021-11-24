import FN from './FN'

export function getUserAgent() {
  return 'Mobile'
}

export function isEventSelf(event) {
  // 小程序不是 dom 真实元素，利用 id 可以用于判定
  return event.target.id === event.currentTarget.id
}

export function startScrollView(callback) {
  FN.PS.subscribe('scrollView', () => callback())
}

export function stopScrollView() {
  FN.PS.unsubscribe('scrollView')
}