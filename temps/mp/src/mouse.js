import FN from './common/FN'
import GV from './common/GV'

const log = console.log

class MouseProxy {
  constructor() {
    this.x = this.y = this.sx = this.sy = 0
    this.isDrag = false
  }
  start(ev) {
    let e = ev.touches[0]
    // 如果事务ID 不存在，则允许创建新的事务ID，开启新的事务
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
      log('事务未结束：', this.bid, e.target)
    }
  }
  move(ev) {
    let e = ev.touches[0]
    // 限定对事务开启后生效
    if (this.bid) {
      this.x = e.clientX
      this.y = e.clientY

      if (GV.T() - this.T > 100) {
        this.isDrag = true
      }
    }
    // 动作无关
    this.mx = e.clientX
    this.my = e.clientY
  }
  end(ev) {
    // 事务结束，清理 bid
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

export var MOUSE = mouse

export var MouseMixin = {
  methods: {
    touchstart(e) {
      mouse.start(e)
    },
    touchmove(e) {
      mouse.move(e)
    },
    touchend(e) {
      this.app.lockScroll = false
      mouse.end(e)
    }
  },
}
