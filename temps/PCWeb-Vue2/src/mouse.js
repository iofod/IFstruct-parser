import FN from './common/FN'

class MouseProxy {
  constructor() {
    this.x = this.y = this.sx = this.sy = 0
    this.isDrag = false
  }
  start(e) {
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
      log(this.bid, e.target)
    }
  }
  move(e) {
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
  end(e) {
    if (this.bid) {
      this.bid = undefined
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

window.MOUSE = window.ProxyMouse = mouse

// capture all
window.addEventListener('mousedown', e => mouse.start(e), true)
window.addEventListener('mousemove', e => mouse.move(e), true)
window.addEventListener('mouseup', e => mouse.end(e), true)

// for FA useInteractionFlow
window.$ds = 1