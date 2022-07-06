export function calcLeftTop(style) {
  style.left = style.x + 'px'
  style.top = style.y + 'px'
}

export function LAYOUT() {
  let obj = this.IT || {}

  return obj.layout
}

export function px2any(str, _) {
  return str
}