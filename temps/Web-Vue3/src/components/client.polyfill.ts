export function calcLeftTop(style) {
  style.left = style.x / 50 + 'rem'
  style.top = style.y / 50 + 'rem'
}

export function LAYOUT() {
  return {}
}

function calcUnit(n: any) {
  return n / 50 + 'rem'
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