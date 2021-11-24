function getRotate(el) {
  let tf = el.style.transform
  if (!tf) return 0
  let select = tf.match(/rotate\((.*?)deg\)/)
  return select ? Number(select[1]) || 0 : 0
}

function calcRotate(el) {
  let d = getRotate(el)
  while ((el = el.offsetParent)) {
    d += getRotate(el)
  }
  return d
}

function rotatePoint(x1, y1, rx, ry, d) {
  d = (d * Math.PI) / 180
  let x = (x1 - rx) * Math.cos(d) - (y1 - ry) * Math.sin(d) + rx
  let y = (x1 - rx) * Math.sin(d) + (y1 - ry) * Math.cos(d) + ry

  return [x, y]
}

window.rotatePoint = rotatePoint

export default {
  calcRotate, calcRotate, rotatePoint
}