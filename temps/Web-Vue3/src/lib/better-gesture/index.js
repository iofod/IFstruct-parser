import { getUserAgent, isEventSelf, startScrollView, stopScrollView } from './lib.polyfill'

function getLen(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

function dot(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y
}

function getAngle(v1, v2) {
  let mr = getLen(v1) * getLen(v2)
  if (mr === 0) return 0
  let r = dot(v1, v2) / mr
  if (r > 1) r = 1
  return Math.acos(r)
}

function cross(v1, v2) {
  return v1.x * v2.y - v2.x * v1.y
}

function getRotateAngle(v1, v2) {
  let angle = getAngle(v1, v2)
  if (cross(v1, v2) > 0) {
    angle *= -1
  }

  return (angle * 180) / Math.PI
}

class Observer {
  constructor(el, modifiers) {
    this._Observer = {}
    this.el = el
    this.modifiers = modifiers
  }
  register(type, func) {
    if (typeof func === 'function') {
      if (typeof this._Observer[type] === 'undefined') {
        this._Observer[type] = [func]
      } else {
        this._Observer[type].push(func)
      }
    }
  }
  dispatch(type, args) {
    if (this._Observer[type]) {
      if (this.modifiers.self && isEventSelf(args)) {
        return
      }
      let that = this
      args.gesture = {
        event: Object.keys(this._Observer),
        on: function (type, func) {
          that.register(type, func)
        },
        off: function (type) {
          that.remove(type)
        },
        destroy: function () {
          that._Observer = {}
        },
      }
      for (let i = 0, len = this._Observer[type].length; i < len; i++) {
        let handler = this._Observer[type][i]
        typeof handler === 'function' && handler.call(this.el, args)
      }
      //================ 增强事件修饰使用
      if (this.modifiers.once) {
        this.remove(type)
      }
    }
  }
  remove(type) {
    if (this._Observer[type] instanceof Array) {
      for (let i = this._Observer[type].length - 1; i >= 0; i--) {
        this._Observer[type].splice(i, 1)
      }
    }
  }
}
export default class BetterGesture {
  constructor(el, option = {}) {
    this.element = typeof el == 'string' ? document.querySelector(el) : el
    this.userAgent = getUserAgent()
    this.modifiers = option.modifiers || {}
    this.eventName = option.eventName
    this.Observer = new Observer(this.element, this.modifiers)

    this.start = this.start.bind(this)
    this.move = this.move.bind(this)
    this.end = this.end.bind(this)
    this.cancel = this.cancel.bind(this)
    this.mouseOver = this.mouseOver.bind(this)
    this.mouseOut = this.mouseOut.bind(this)

    let eventOption = {
      capture: Boolean(this.modifiers.capture),
      passive: Boolean(this.modifiers.passive),
    }

    let isMobile = this.userAgent === 'Mobile'
    let isPC = this.userAgent === 'PC'

    this.isMobile = isMobile
    this.isPC = isPC

    if (isMobile) {
      this.element.addEventListener('touchstart', this.start, eventOption)
      this.element.addEventListener('touchmove', this.move, eventOption)
      this.element.addEventListener('touchend', this.end, eventOption)
      this.element.addEventListener('touchcancel', this.cancel, eventOption)
    }

    if (isPC) {
      this.mouseLeave = this.mouseLeave.bind(this)
      this.element.addEventListener('mousedown', this.start, eventOption)
      this.element.addEventListener('mousemove', this.move, eventOption)
      this.element.addEventListener('mouseup', this.end, eventOption)
      this.element.addEventListener('mouseover', this.mouseOver, eventOption)
      this.element.addEventListener('mouseout', this.mouseOut, eventOption)
      this.element.addEventListener('mouseleave', this.mouseLeave, eventOption)
    }

    // PC Mobile
    this.Observer.register('start', option.start)
    this.Observer.register('end', option.end)
    this.Observer.register('pressmove', option.pressmove)
    this.Observer.register('swipe', option.swipe)
    this.Observer.register('swipeleft', option.swipeleft)
    this.Observer.register('swiperight', option.swiperight)
    this.Observer.register('swipeup', option.swipeup)
    this.Observer.register('swipedown', option.swipedown)
    this.Observer.register('tap', option.tap)
    this.Observer.register('doubleTap', option.doubleTap)
    this.Observer.register('longtap', option.longtap)
    this.Observer.register('singleTap', option.singleTap)

    if (isMobile) {
      this.Observer.register('touchStart', option.touchStart)
      this.Observer.register('touchMove', option.touchMove)
      this.Observer.register('touchEnd', option.touchEnd)
      this.Observer.register('touchCancel', option.touchCancel)
      this.Observer.register('moreFingerStart', option.moreFingerStart)
      this.Observer.register('multipointEnd', option.multipointEnd)
      this.Observer.register('pinch', option.pinch)
      this.Observer.register('twoFingerPressMove', option.twoFingerPressMove)
      this.Observer.register('rotate', option.rotate)
    }

    if (isPC) {
      this.Observer.register('mouseDown', option.mouseDown)
      this.Observer.register('mouseMove', option.mouseMove)
      this.Observer.register('mouseUp', option.mouseUp)
      this.Observer.register('mouseOver', option.mouseOver)
      this.Observer.register('mouseOut', option.mouseOut)
    }

    this._cancelAllHandler = this.cancelAll.bind(this)

    startScrollView.bind(this)(this._cancelAllHandler)

    this.preV = { x: null, y: null }
    this.pinchStartLen = null
    this.zoom = 1
    this.isDoubleTap = false
    this.delta = null
    this.last = null
    this.now = null
    this.tapTimeout = null
    this.singleTapTimeout = null
    this.longTapTimeout = null
    this.swipeTimeout = null
    this.lastTime = null
    this.x1 = this.x2 = this.y1 = this.y2 = null
    this.preTapPosition = { x: null, y: null }
    this.isPress = false
  }
  start(evt) {
    if (this.modifiers.stop) {
      evt.stopPropagation()
    }
    if (this.modifiers.prevent) {
      evt.preventDefault()
    }

    this.now = Date.now()
    this.isPress = true
    if (this.userAgent === 'Mobile' || this.userAgent === 'Mini') {
      this.x1 = evt.touches[0].pageX
      this.y1 = evt.touches[0].pageY
    } else {
      this.x1 = evt.pageX
      this.y1 = evt.pageY
    }

    this.delta = this.now - (this.last || this.now)
    this.Observer.dispatch('start', evt)
    this.Observer.dispatch(
      this.userAgent === 'Mobile' || this.userAgent === 'Mini' ? 'touchStart' : 'mouseDown',
      evt
    )
    if (this.preTapPosition.x !== null) {
      this.isDoubleTap =
        this.delta > 0 &&
        this.delta <= 250 &&
        Math.abs(this.preTapPosition.x - this.x1) < 30 &&
        Math.abs(this.preTapPosition.y - this.y1) < 30
      if (this.isDoubleTap) clearTimeout(this.singleTapTimeout)
    }
    this.preTapPosition.x = this.x1
    this.preTapPosition.y = this.y1
    this.last = this.now
    let preV = this.preV
    if (evt.touches && evt.touches.length > 1) {
      this._cancelLongTap()
      this._cancelSingleTap()
      let v = {
        x: evt.touches[1].pageX - this.x1,
        y: evt.touches[1].pageY - this.y1,
      }
      preV.x = v.x
      preV.y = v.y
      this.pinchStartLen = getLen(preV)
      this.Observer.dispatch('moreFingerStart', evt)
    }
    this._preventTap = false
    this.longTapTimeout = setTimeout(
      function () {
        this.Observer.dispatch('longtap', evt)
        this._preventTap = true
      }.bind(this),
      750
    )
  }
  move(evt) {
    if (this.modifiers.stop) {
      evt.stopPropagation()
    }
    if (this.modifiers.prevent) {
      evt.preventDefault()
    }

    let preV = this.preV,
      currentX = 0,
      currentY = 0
    if (this.userAgent === 'Mobile' || this.userAgent === 'Mini') {
      currentX = evt.touches[0].pageX
      currentY = evt.touches[0].pageY
    } else {
      currentX = evt.pageX
      currentY = evt.pageY
    }
    this.isDoubleTap = false
    if (evt.touches && evt.touches.length > 1) {
      let sCurrentX = evt.touches[1].pageX,
        sCurrentY = evt.touches[1].pageY
      let v = {
        x: evt.touches[1].pageX - currentX,
        y: evt.touches[1].pageY - currentY,
      }

      if (preV.x !== null) {
        if (this.pinchStartLen > 0) {
          evt.zoom = getLen(v) / this.pinchStartLen
          this.Observer.dispatch('pinch', evt)
        }

        evt.angle = getRotateAngle(v, preV)
        this.Observer.dispatch('rotate', evt)
      }
      preV.x = v.x
      preV.y = v.y

      if (this.x2 !== null && this.sx2 !== null) {
        evt.deltaX = (currentX - this.x2 + sCurrentX - this.sx2) / 2
        evt.deltaY = (currentY - this.y2 + sCurrentY - this.sy2) / 2
      } else {
        evt.deltaX = 0
        evt.deltaY = 0
      }
      this.Observer.dispatch('twoFingerPressMove', evt)
      this.sx2 = sCurrentX
      this.sy2 = sCurrentY
    } else {
      if (this.x2 !== null) {
        evt.deltaX = currentX - this.x2
        evt.deltaY = currentY - this.y2
        //move事件中添加对当前触摸点到初始触摸点的判断，
        //如果曾经大于过某个距离(比如10),就认为是移动到某个地方又移回来，应该不再触发tap事件才对。
        let movedX = Math.abs(this.x1 - this.x2),
          movedY = Math.abs(this.y1 - this.y2)

        if (movedX > 10 || movedY > 10) {
          this._preventTap = true
        }
      } else {
        evt.deltaX = 0
        evt.deltaY = 0
      }
      if (this.lastTime !== null) {
        evt.deltaTime = Date.now() - this.lastTime
      } else {
        evt.deltaTime = 0
      }
      if (this.isPress) {
        this.Observer.dispatch('pressmove', evt)
      }
    }
    this.Observer.dispatch(
      this.userAgent === 'Mobile' || this.userAgent === 'Mini' ? 'touchMove' : 'mouseMove',
      evt
    )

    this._cancelLongTap()
    this.x2 = currentX
    this.y2 = currentY
    this.lastTime = Date.now()

    if (evt.preventDefault && evt.touches && evt.touches.length > 1) {
      evt.preventDefault()
    }
  }
  end(evt) {
    if (this.modifiers.stop) {
      evt.stopPropagation()
    }
    if (this.modifiers.prevent) {
      evt.preventDefault()
    }

    this._cancelLongTap()
    this.isPress = false
    let self = this
    if (evt.touches && evt.touches.length < 2) {
      this.Observer.dispatch('multipointEnd', evt)
      this.sx2 = this.sy2 = null
    }

    if (
      (this.x2 && Math.abs(this.x1 - this.x2) > 30) ||
      (this.y2 && Math.abs(this.y1 - this.y2) > 30)
    ) {
      let direction = this._swipeDirection(this.x1, this.x2, this.y1, this.y2)

      evt.direction = direction

      this.swipeTimeout = setTimeout(function () {
        self.Observer.dispatch('swipe', evt)
        self.Observer.dispatch('swipe' + direction, evt)
      }, 0)
    } else {
      this.tapTimeout = setTimeout(function () {
        if (!self._preventTap) {
          self.Observer.dispatch('tap', evt)
        }
        // trigger double tap immediately
        if (self.isDoubleTap) {
          self.Observer.dispatch('doubleTap', evt)
          self.isDoubleTap = false
        }
      }, 0)

      if (!self.isDoubleTap) {
        self.singleTapTimeout = setTimeout(function () {
          self.Observer.dispatch('singleTap', evt)
        }, 250)
      }
    }
    this.Observer.dispatch('end', evt)
    this.Observer.dispatch(
      this.userAgent === 'Mobile' || this.userAgent === 'Mini' ? 'touchEnd' : 'mouseUp',
      evt
    )
    this.preV.x = 0
    this.preV.y = 0
    this.zoom = 1
    this.pinchStartLen = null
    this.x1 = this.x2 = this.y1 = this.y2 = this.lastTime = null
  }
  mouseLeave(evt) {
    this.isPress = false
    this.Observer.dispatch('mouseLeave', evt)
  }
  mouseOver(evt) {
    this.Observer.dispatch('mouseOver', evt)
  }
  mouseOut(evt) {
    this.Observer.dispatch('mouseOut', evt)
  }
  cancel(evt) {
    this.cancelAll()
    this.Observer.dispatch('touchCancel', evt)
  }
  cancelAll() {
    this._preventTap = true
    clearTimeout(this.singleTapTimeout)
    clearTimeout(this.tapTimeout)
    clearTimeout(this.longTapTimeout)
    clearTimeout(this.swipeTimeout)
  }
  _cancelLongTap() {
    clearTimeout(this.longTapTimeout)
  }
  _cancelSingleTap() {
    clearTimeout(this.singleTapTimeout)
  }
  _swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >= Math.abs(y1 - y2)
      ? x1 - x2 > 0
        ? 'left'
        : 'right'
      : y1 - y2 > 0
      ? 'up'
      : 'down'
  }
  //注册
  on(type, func) {
    this.Observer.register(type, func)
  }
  // 移除
  off(type, func) {
    this.Observer.remove(type, func)
  }
  destroy() {
    // 清除定时器
    if (this.singleTapTimeout) clearTimeout(this.singleTapTimeout)
    if (this.tapTimeout) clearTimeout(this.tapTimeout)
    if (this.longTapTimeout) clearTimeout(this.longTapTimeout)
    if (this.swipeTimeout) clearTimeout(this.swipeTimeout)

    if (this.isMobile) {
      this.element.removeEventListener('touchstart', this.start)
      this.element.removeEventListener('touchmove', this.move)
      this.element.removeEventListener('touchend', this.end)
      this.element.removeEventListener('touchcancel', this.cancel)
    }

    if (this.isPC) {
      this.element.removeEventListener('mousedown', this.start)
      this.element.removeEventListener('mousemove', this.move)
      this.element.removeEventListener('mouseup', this.end)
      this.element.removeEventListener('mouseup', this.end)
      this.element.removeEventListener('mouseover', this.mouseOver)
      this.element.removeEventListener('mouseLeave', this.mouseLeave)
    }

    this.Observer._Observer = {}
    // 状态滞空
    this.preV =
      this.pinchStartLen =
      this.zoom =
      this.isDoubleTap =
      this.delta =
      this.last =
      this.now =
      this.tapTimeout =
      this.lastTime =
      this.singleTapTimeout =
      this.longTapTimeout =
      this.swipeTimeout =
      this.x1 =
      this.x2 =
      this.y1 =
      this.y2 =
      this.preTapPosition =
        null

    stopScrollView.bind(this)()

    return null
  }
}
