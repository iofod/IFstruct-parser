import RT from './common/RT'
function copy2Global(oel, zoom) {
  let hero = oel.cloneNode(true)
  let orect = oel.getBoundingClientRect()

  let vrect = document.querySelector('.page').getBoundingClientRect()
  let wrap = document.body //不是编辑器内部，参照物可变成最外层

  let S = orect.width / oel.clientWidth
  let R = RT.calcRotate(oel) // 获得环境叠加旋转

  let ow = orect.width / S
  let oh = orect.height / S

  orect.x += (S - 1) * ow / 2
  orect.y += (S - 1) * oh / 2

  orect.width = ow
  orect.height = oh

  let rx = orect.x + orect.width / 2 - vrect.x
  let ry = orect.y + orect.height / 2 - vrect.y

  // 借助 clientWidth / 2 两个中心点旋转缩放不变原理，通过中心点这个媒介获得其真正的 rect
  let x = (rx - oel.clientWidth * zoom / 2) / zoom
  let y = (ry - oel.clientHeight * zoom / 2) / zoom

  hero.style.position = 'absolute'
  hero.style.left = x  + 'px',
  hero.style.top = y  + 'px',
  hero.style.transform = hero.style.transform.replace(/rotate\((.*?)deg\)/, `rotate(${R}deg)`)

  wrap.appendChild(hero)

  let isDestory = false

  return {
    oel,
    x,
    y,
    vrect,
    orect,
    hero,
    destory() {
      if (!isDestory) {
        isDestory = true

        wrap.removeChild(hero)
      }
    }
  }
}

export default {
  copy2Global
}