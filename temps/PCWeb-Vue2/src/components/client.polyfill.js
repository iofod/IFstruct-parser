function calcUnit(n) {
  return n + 'px'
}

export function calcRect(style, x, y, tx, ty) {
  if (tx == 0) {
    style.left = calcUnit(x)
  } else {
    style.right = calcUnit(x)
  }

  if (ty == 0) {
    style.top = calcUnit(y)
  } else {
    style.bottom = calcUnit(y)
  }
}

export function LAYOUT() {
  let obj = this.IT || {}

  return obj.layout
}

export function px2any(str, _) {
  return str
}