export function getUserAgent() {
  if (/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)) {
    return 'Mobile'
  } else {
    return 'PC'
  }
}

export function isEventSelf(event) {
  return event.target === event.currentTarget
}

export function startScrollView(callback) {
  typeof window !== 'undefined' && window.addEventListener('scroll', this._cancelAllHandler)
}

export function stopScrollView() {
  typeof window !== 'undefined' && window.removeEventListener('scroll', this._cancelAllHandler)
}
