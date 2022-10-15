import FN from './FN'
import { VData } from './vdata'
import FA from './FA'
import GV from '../lib/GV'
import { MOUSE } from './mouse'
import { $store } from '../store/index'
import { playMouseRecord } from '../lib/auto/mockPointer'
const Global = $store.history

function parseNumberUnit(value: any) {
  if (value === undefined) return [undefined, '']
  if (typeof value == 'number') return [value, '']

  let V = parseFloat(value)

  return [V, value.replace(String(V), '')]
}

function getELS(hid: string) {
  return Array.from(document.querySelectorAll('[hid="' + hid + '"]'))
}

function setTransition(data, target, during, curve) {
  let els: any = getELS(target)

  if (!els.length) return console.warn(target, 'is unfinded')

  let record: any = []

  els.forEach((el, i) => {
    let { transitionDuration, transitionTimingFunction, transitionProperty } = el.style

    record[i] = {
      transitionDuration,
      transitionTimingFunction,
      transitionProperty,
    }

    el.style.transitionDuration = during + 'ms'
    el.style.transitionTimingFunction = curve
    el.style.transitionProperty = 'all'
  })

  setTimeout(() => {
    els.forEach((el, i) => {
      let { transitionDuration, transitionTimingFunction, transitionProperty } = record[i]

      el.style.transitionDuration = transitionDuration
      el.style.transitionTimingFunction = transitionTimingFunction
      el.style.transitionProperty = transitionProperty
    })

    data.next && data.next('done!')
  }, during)
}

function rafity(fn: Function, context: any) {
  let aid = 0
  let done: Boolean = false

  function rfn(...arg: any[]) {
    if (done) return

    fn(...arg)

    aid = window.requestAnimationFrame(rfn.bind(context))
  }

  rfn.done = () => {
    done = true;

    window.cancelAnimationFrame(aid)

    aid = 0
  }

  return rfn
}

function getActiveMetaState(hid) {
  let target = FN.SETS(hid)

  if (!target) console.warn(hid, 'target not find')

  return FN.GET_META_STATE(target)
}

function initActionListener() {
  FN.PS.subscribe('Fx_statu_change', (msg, data) => {
    let { hid, target, state, stateA, stateB, during, curve } = data

    target = FN.parseModelStr(target, hid)

    let curr = FN.SETS(target)
    let oldState
    let newState

    if (state) {
      oldState = getActiveMetaState(target)
      newState = curr.status.filter((statu) => statu.id == state)[0]
    }

    if (stateA && stateB) {
      let [A, B] = curr.status.filter((statu) => statu.id == stateA || statu.id == stateB)

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

    setTransition(data, target, during, curve)
  })

  FN.PS.subscribe('Fx_changeActive', (msg, data) => {
    let { hid, target, subState, during, curve, active } = data

    let realTarget = FN.parseModelStr(target, hid)

    setTransition(data, realTarget, during, curve)

    let curr = FN.SETS(realTarget)

    if (subState) {
      let selected = curr.status.filter((statu) => statu.id == subState)[0]

      if (selected) selected.active = active
    }
  })

  FN.PS.subscribe('Fx_editStatu', (msg, data) => {
    let { hid, target, state, key, value } = data

    target = FN.parseModelStr(target, hid)

    let curr = FN.SETS(target)

    if (!curr) return console.warn('curr is invalid', data, target, curr)
    if (!state) return

    let selected = curr.status.filter((statu) => statu.id == state)[0]

    if (!selected) return console.warn('state is invalid', data, state)

    let OBJ = selected.style
    let V

    if (typeof OBJ[key] == 'number') {
      V = Number(value) || 0
    } else {
      if (!OBJ[key]) {
        V = value
      } else {
        let [ov, unit] = parseNumberUnit(OBJ[key])

        V = Number.isNaN(ov) ? value : (Number(value) || 0) + unit
      }
    }

    OBJ[key] = V
  })

  FN.PS.subscribe('Fx_animate', (msg, data) => {
    let { hid, target, frames, during, delay, curve, loop } = data

    if (!frames.length) return

    target = FN.parseModelStr(target, hid)

    let els = getELS(target)

    if (!els.length) {
      return console.warn(target, 'is invalid')
    }

    FA.AniList[hid] = FN.anime({
      targets: els,
      keyframes: frames,
      duration: during,
      delay: FN.anime.stagger(delay),
      easing: curve,
      loop,
      complete: () => {
        console.warn('Fx_animate complete')
        data.next('animate done!')
      },
    })
  })

  FN.PS.subscribe('Fx_interactionFlow', (msg, data) => {
    let { hid, target, state, key, exp, map } = data

    target = FN.parseModelStr(target, hid)

    if (!key || !exp) return console.warn('invalid key or exp')

    let curr = FN.SETS(target)

    if (!curr) return console.warn('curr is invalid', data, target, curr)

    let OBJ
    let ov // old value
    let unit
    let writer

    let ME: any = MOUSE

    if (Global.useRunCases) {
      ME = playMouseRecord(Global.previewEventMap[hid])
    }

    if (state) {
      let selected = curr.status.filter((statu) => statu.id == state)[0]

      if (!selected) return console.warn('state is invalid', data, state)

      OBJ = selected.style

      let tv = OBJ[key]

      if (typeof tv == 'number') {
        ov = tv
        unit = 0
      } else {
        ;[ov, unit] = parseNumberUnit(tv)
      }

      writer = (V) => OBJ[key] = V + unit
    } else {
      ;[ov, unit] = parseNumberUnit(curr.model[key].value)

      writer = (V) => FN.SET_MODEL(target)(key, V + unit, '$N')
    }

    let fn = new Function('$dx', '$dy', '$x', '$y', 'return ' + exp)

    let ldx = 0
    let ldy = 0
    let spx = 0
    let spy = 0
    let RX = new VData()

    if (map) {
      let config = new Function('RX', 'return ' + map)

      config(RX)
    }

    let calc = (dx, dy, x, y) => {
      let v = ov + fn(dx, dy, x, y)

      if (v < RX.min) v = RX.min
      if (v > RX.max) v = RX.max

      return v
    }

    let RAF = () => {
      spx = ME.dx - ldx
      spy = ME.dy - ldy

      ldx = ME.dx
      ldy = ME.dy

      let cv = calc(ME.dx, ME.dy, ME.x, ME.y)

      if (RX.delay) {
        setTimeout(() => {
          writer(cv)
        }, 100)
      } else {
        writer(cv)
      }
    }

    if (RX.te) RAF = GV.throttle(RX.te, RAF)

    let tick: any = rafity(RAF, this)

    tick()

    FN.PS.subscribeOnce('ProxyMouseupSync', () => {
      let [dx, dy, x, y] = [ME.dx, ME.dy, ME.x, ME.y]

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

        let inertia = rafity(() => {
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

    if (!key || !exp) return console.warn('invalid key or exp')

    let curr = FN.SETS(target)

    if (!curr) return console.warn('curr is invalid', data, target, curr)

    let OBJ
    let ov // old value
    let unit
    let writer

    if (state) {
      let selected = curr.status.filter((statu) => statu.id == state)[0]

      if (!selected) return console.warn('state is invalid', data, state)

      OBJ = selected.style

      let tv = OBJ[key]

      if (typeof tv == 'number') {
        ov = tv
        unit = 0
      } else {
        ;[ov, unit] = parseNumberUnit(tv)
      }

      writer = (V) => OBJ[key] = V + unit
    } else {
      ;[ov, unit] = parseNumberUnit(curr.model[key].value)

      writer = (V) => FN.SET_MODEL(target)(key, V + unit, '$N')
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
      },
    })
  })

  FN.PS.subscribe('Fx_router_go', (msg, data) => {
    let step = Number(data.param)

    console.log('Fx_router_go', data, step)

    this.$router.go(step)
  })
}

export default {
  methods: {
    initActionListener
  }
}
