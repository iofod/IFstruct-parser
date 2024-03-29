import FN from './FN'
import GV from '../lib/GV'

class MouseProxy {
  x = 0
  y = 0
  sx = 0
  sy = 0
  T = 0
  mx = 0
  my = 0
  isDrag = false
  bid = ''
  start(e: MouseEvent) {
    if (!this.bid) {
      this.bid = GV.randomStr()
      this.sx = e.clientX
      this.sy = e.clientY
      this.x = this.sx
      this.y = this.sy

      FN.PS.publishSync('ProxyMousedownSync', this)
      FN.PS.publish('ProxyMousedown', this)

      this.T = GV.T()
    } else {
      console.log(this.bid, e.target)
    }
  }
  move(e: MouseEvent) {
    if (this.bid) {
      this.x = e.clientX
      this.y = e.clientY

      if (GV.T() - this.T > 100) {
        this.isDrag = true
      }
    }
    this.mx = e.clientX
    this.my = e.clientY
  }
  end(_ev: MouseEvent) {
    if (this.bid) {
      this.bid = ''
      this.isDrag = false

      FN.PS.publishSync('ProxyMouseupSync', this)
      FN.PS.publish('ProxyMouseup', this)
    }
  }
  get dx() {
    return this.x - this.sx
  }
  get dy() {
    return this.y - this.sy
  }
}

let mouse = new MouseProxy()

export const MOUSE = mouse
export const ProxyMouse = mouse

// capture all
window.addEventListener('mousedown', e => mouse.start(e), true)
window.addEventListener('mousemove', e => mouse.move(e), true)
window.addEventListener('mouseup', e => mouse.end(e), true)

// for FA useInteractionFlow
;(window as any).$ds = 1

function setDevice() {
  let target = FN.SETS('device')
  let iw = window.innerWidth
  let ih = window.innerHeight

  if (target) {
    (window as any).SDK.SET_MODEL('device')('vw', iw)
    (window as any).SDK.SET_MODEL('device')('vh', ih)
  }
}

window.addEventListener('resize', setDevice)

setTimeout(() => setDevice(), 17)
