function getRotate(el) {
  let tf = el.style.transform
  if (!tf) return 0
  let select = tf.match(/rotateZ\((.*?)deg\)/)
  return select ? Number(select[1]) || 0 : 0
}

function calcRotate(el) {
  let d = getRotate(el)
  while ((el = el.offsetParent)) {
    d += getRotate(el)
  }
  return d
}

export default {
  getRotate,
  calcRotate
}
