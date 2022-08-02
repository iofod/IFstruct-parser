export function calcUnit(n) {
  return n / 50 + 'rem'
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
  return {}
}

export function px2any(str: string, m = ' ') {
  if (str.includes(m)) {
    return str
      .split(m)
      .map((v) => {
        let i = v.indexOf('px')

        return i > 0 ? calcUnit(v.substring(0, i)) : v
      })
      .join(m)
  } else {
    return calcUnit(str.substring(0, str.length - 2))
  }
}