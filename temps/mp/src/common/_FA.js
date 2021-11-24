import FN from './FN'
import { VData } from './vdata'
import { MOUSE } from '../mouse'

var __VM__ = null
var $ds = 1 //小程序统一是 750

function initActionHandler() {
  const getActiveMetaState = (hid) => {
    let target = this.SETS[hid]

    if (!target) {
      warn(hid, 'target not find')
    }

    return target.status.filter(state => !state.name.includes(':') && state.active)[0]
  }

  const diffProps = (op, np) => {
    let obj = {}

    if (!op || !np) return obj

    for (let key in np) {
      if (!op.hasOwnProperty(key) || op[key] != np[key]) {
        obj[key] = np[key]
      }
    }

    return obj
  }

  const diffState = (os, ns) => {
    let ap = {} //animateProp
    let op = os.props
    let np = ns.props

    if (np.x != op.x) ap.left = np.x
    if (np.y != op.y) ap.top = np.y
    if (np.d != op.d) ap.rotate = np.d

    if (np.option.V != op.option.V) ap.visibility = np.option.V ? 'visible' : 'hidden'

    let props = Object.assign(
      ap,
      diffProps(op.style, np.style),
      diffProps(op.option.customKeys, np.option.customKeys)
    )

    return props
  }

  const setAnime = (data, target, during, curve, oldState, newState) => {
    let els = this.getELS(target)

    if (!els.length) {
      return warn(target, '元素不存在')
    }

    let ap = {} //animateProp
    let op = oldState.props
    let np = newState.props

    if (np.x != op.x) ap.left = np.x
    if (np.y != op.y) ap.top = np.y
    if (np.d != op.d) ap.rotate = np.d

    if (np.option.V != op.option.V) ap.visibility = np.option.V ? 'visible' : 'hidden'

    let props = Object.assign(
      ap,
      diffProps(op.style, np.style),
      diffProps(op.option.customKeys, np.option.customKeys), {
        duration: during,
        easing: curve,
      }
    )

    let ani = FN.anime({
      targets: els,
      ...props,
      complete: () => {
        oldState.active = false
        newState.active = true
        setTimeout(() => {
          data.next('statu done!')
        }, 0)
      }
    })

    log('ani', op.d, np.d, props)
  }

  const setTransition = (newState, during, curve) => new Promise(done => {
    let oldValue = newState.style.transition

    this.$set(newState.style, 'transition', `all ${during}ms ${curve}`)

    setTimeout(() => {
      if (oldValue) {
        this.$set(newState.style, 'transition', oldValue)
      } else {
        this.$delete(newState.style, 'transition')
      }
      done()
    }, during)
  })

  FN.PS.subscribe('Fx_statu_change', (msg, data) => {
    let {
      hid,
      target,
      state,
      stateA,
      stateB,
      during,
      curve,
      loop,
      pushState
    } = data

    target = FN.parseModelStr(target, hid)

    let curr = this.SETS[target]

    let oldState
    let newState
    let index

    // 1. 状态切换
    if (state) {
      oldState = getActiveMetaState(target)

      newState = curr.status.filter(statu => statu.id == state)[0]
    }

    // 2. 状态互切
    if (stateA && stateB) {
      let [A, B] = curr.status.filter(
        statu => statu.id == stateA || statu.id == stateB
      )

      if (A.active) {
        oldState = A
        newState = B
      } else {
        oldState = B
        newState = A
      }

      if (!A.active && !B.active) {
        oldState = getActiveMetaState(target)
        newState = A
      }
    }

    if (oldState) oldState.active = false
    if (newState) newState.active = true

    setTransition(newState, during, curve)
  })

  FN.PS.subscribe('Fx_changeActive', (msg, data) => {
    let {
      hid,
      target,
      subState,
      during,
      curve,
      active
    } = data

    let realTarget = FN.parseModelStr(target, hid)
    let curr = this.SETS[realTarget]

    if (subState) {
      let selected = curr.status.filter(statu => statu.id == subState)[0]

      if (selected) {
        setTransition(selected, during, curve)

        selected.active = active
      }
    }
  })

  FN.PS.subscribe('Fx_editStatu', (msg, data) => {
    let { hid, target, state, key, value } = data

    target = FN.parseModelStr(target, hid)

    let curr = this.SETS[target]

    if (!curr) return warn('curr is invalid', data, target, curr)
    if (!state) return

    let selected = curr.status.filter(statu => statu.id == state)[0]

    if (!selected) return warn('state is invalid', data, state)

    let OBJ = selected.style
    let V

    if (typeof OBJ[key] == 'number') {
      V = Number(value) || 0
    } else {
      if (!OBJ[key]) {
        V = value
      } else {
        let [ov, unit] = FN.parseNumberUnit(OBJ[key])

        V = Number.isNaN(ov) ? value : (Number(value) || 0) + unit
      }
    }

    this.$set(OBJ, key, V)
  })

  FN.PS.subscribe('Fx_interactionFlow', (msg, data) => {
    let { hid, target, state, key, exp, map } = data

    target = FN.parseModelStr(target, hid)

    if (!key || !exp) return warn('invalid key or exp')

    let curr = this.SETS[target]
    if (!curr) return warn('curr is invalid', data, target, curr)

    let OBJ
    let ov // old value
    let unit
    let writer

    //1. 作用于状态的情况
    if (state) {
      let selected = curr.status.filter(statu => statu.id == state)[0]

      if (!selected) return warn('state is invalid', data, state)

      OBJ = selected.style

      let tv = OBJ[key]

      if (typeof tv == 'number') {
        ov = tv
        unit = 0
      } else {
        [ov, unit] = FN.parseNumberUnit(tv)
      }
      
      writer = V => this.$set(OBJ, key, V + unit)

    } else {
      //2. 作用于模型变量的情况
      [ov, unit] = FN.parseNumberUnit(curr.model[key].value)

      writer = V => FN.SET_MODEL(target)(key, V + unit, '$N')
    }

    let fn = exp

    let ldx = 0
    let ldy = 0
    let spx = 0
    let spy = 0
    let RX = new VData()

    if (map) {
      map(RX)
    }

    let calc = (dx, dy, x, y) => {
      let v = ov + fn(dx, dy, x, y, $ds) // 坐标系需要翻转，所以用 - 不用 +

      if (v < RX.min) v = RX.min
      if (v > RX.max) v = RX.max

      return v
    }
    
    let RAF = () => {
      spx = MOUSE.dx - ldx //每一帧移动的距离
      spy = MOUSE.dy - ldy

      ldx = MOUSE.dx
      ldy = MOUSE.dy

      let cv = calc(MOUSE.dx, MOUSE.dy, MOUSE.x, MOUSE.y)

      if (RX.delay) {
        setTimeout(() => {
          writer(cv)
        }, 100)
      } else {
        writer(cv)
      }
    }

    if (RX.te) RAF = GV.throttle(RX.te, RAF)

    let tick = FN.rafity(RAF, this)

    tick()

    FN.PS.subscribeOnce('ProxyMouseupSync', () => {
      let [dx, dy, x, y] = [MOUSE.dx, MOUSE.dy, MOUSE.x, MOUSE.y]

      if (tick) {
        tick.done()
        tick = null

        ldx = 0
        ldy = 0

        if ((Math.abs(spx) < 10 && Math.abs(spy) < 10) || RX.f == 0) {
          data.next('useInteractionFlow done!')

          spx = 0
          spy = 0
          return
        }

        let kx = spx > 0 ? 1 : -1
        let ky = spy > 0 ? 1 : -1

        spx = Math.min(Math.abs(spx), 80)
        spy = Math.min(Math.abs(spy), 80)

        let f = 0.99
        let n = RX.f

        let inertia = FN.rafity(() => {
          spx = Math.round(spx * f) - n
          spy = Math.round(spy * f) - n

          if (spx < 2 && spy < 2) {
            spx = 0
            spy = 0

            data.next('useInteractionFlow done!')

            return inertia.done()
          }

          x += spx * kx
          y += spy * ky
          dx += spx * kx
          dy += spy * ky

          writer(calc(dx, dy, x, y))

        }, this)

        inertia()
      }
    })
  })

  FN.PS.subscribe('Fx_interpolation', (msg, data) => {
    let { hid, target, state, key, exp, during, curve } = data

    target = FN.parseModelStr(target, hid)

    if (!key || !exp) return warn('invalid key or exp')

    let curr = this.SETS[target]
    if (!curr) return warn('curr is invalid', data, target, curr)

    let OBJ
    let ov // old value
    let unit
    let writer

    //1. 作用于状态的情况
    if (state) {
      let selected = curr.status.filter(statu => statu.id == state)[0]

      if (!selected) return warn('state is invalid', data, state)

      OBJ = selected.style

      let tv = OBJ[key]

      if (typeof tv == 'number') {
        ov = tv
        unit = 0
      } else {
        [ov, unit] = FN.parseNumberUnit(tv)
      }
      
      writer = V => this.$set(OBJ, key, V + unit)

    } else {
      //2. 作用于模型变量的情况
      [ov, unit] = FN.parseNumberUnit(curr.model[key].value)

      writer = V => FN.SET_MODEL(target)(key, V + unit, '$N')
    }

    let IOJ = { ov }

    FN.anime({
      targets: IOJ,
      ov: FN.parseModelStr(exp, target),
      round: 1,
      easing: curve,
      duration: during,
      update() {
        writer(Number(IOJ.ov))
      },
      complete() {
        data.next('interpolation done!')
      }
    })
  })
}

export default {
  setContext(p) {
    if (!__VM__) {
      initActionHandler.bind(p)()
    }
    __VM__ = p
  },
  getContext() {
    return __VM__
  }
}