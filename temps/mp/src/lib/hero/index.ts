import FN from '../../common/FN'
import RT from './RT'

function copy2Global(oel, zoom, delta = 0) {
  let hero = oel.cloneNode(true)
  let orect = oel.getBoundingClientRect()

  orect.x -= delta

  let vrect = document.body.getBoundingClientRect()
  let wrap = document.body

  let S = orect.width / oel.clientWidth
  let R = RT.calcRotate(oel)

  let ow = orect.width / S
  let oh = orect.height / S

  orect.x += ((S - 1) * ow) / 2
  orect.y += ((S - 1) * oh) / 2

  orect.width = ow
  orect.height = oh

  let rx = orect.x + orect.width / 2 - vrect.x
  let ry = orect.y + orect.height / 2 - vrect.y

  let x = (rx - (oel.clientWidth * zoom) / 2) / zoom
  let y = (ry - (oel.clientHeight * zoom) / 2) / zoom

  hero.style.position = 'absolute'
  ;(hero.style.left = x + 'px'),
    (hero.style.top = y + 'px'),
    (hero.style.transform = hero.style.transform.replace(/rotate\((.*?)deg\)/, `rotate(${R}deg)`))
  hero.style.width = oel.clientWidth + 'px'
  hero.style.height = oel.clientHeight + 'px'

  let isDestory = false

  FN.PS.subscribeOnce('cheanHero', () => {
    isDestory = true

    wrap.removeChild(hero)

    hero.innerHTML = null
  })

  wrap.appendChild(hero)

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
    },
  }
}

export default {
  copy2Global,
}
