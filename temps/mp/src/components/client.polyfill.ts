function calcUnit(n) {
  // TODO 字节  QQ 微信 支付宝 百度 都是 rpx，快应用则是px单位
  return n * 2 + 'rpx'
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
