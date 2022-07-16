<template>
  <div id="app">
    <transition
      v-bind:name="transitionType"
      v-on:before-enter="beforeEnter"
      v-on:before-leave="beforeLeave"
      v-on:after-leave="afterLeave"
    >
      <router-view />
    </transition>
    <Global hid="Global" :clone="''"></Global>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import FN from './common/FN'
import Global from './view/Global.vue'
import { VData } from './vdata'
import Hero from './hero.js'

let T = 0
let flying
let shadow

async function updatePage(pid, tree, sets, vm) {
  if (!sets[pid]) {
    for (let hid in tree) {
      vm.$set(sets, hid, tree[hid])
    }
  }
}

export default {
  name: 'app',
  data() {
    return {
      toward: 'right',
      transitionName: 'slide-left',
    }
  },
  components: {
    Global,
  },
  computed: {
    transitionType() {
      let type = this.historyNavState.transition

      switch (type) {
        case 'slide':
          type = type + '-' + this.toward
          break

        default:
          break
      }
      return type
    },
    historyNavState() {
      let futureList = this.history.future
      if (this.toward == 'left' && futureList.length > 0) {
        let future = futureList[futureList.length - 1]

        return future
      } else {
        return this.history.current
      }
    },
    ...mapState({
      app: (state) => state.app,
      sets: (state) => state.sets,
      pid: (state) => state.app.currentPage,
      history: (state) => state.history,
    }),
  },
  beforeCreate() {
    FN.PS.subscribe('updatePage', (msg, data) => {
      let { tree, pid } = data

      updatePage(pid, tree, this.SETS, this)

      this.APP.currentPage = pid
    })
  },
  methods: {
    beforeEnter(el) {
      el.style.transitionDuration = this.historyNavState.during + 'ms'
    },
    beforeLeave(el) {
      el.style.transitionDuration = this.historyNavState.during + 'ms'
    },
    afterLeave(el) {
      el.style.transitionDuration = ''
    },
    routechange(from, to) {
      FN.PS.publish('routechange', { from, to })
    },
    goback() {
      this.cleanHero()

      if (!this.history.past.length) return

      this.toward = 'left'
      this.history.future.push(this.history.current)

      let p = this.history.past.pop()

      this.HeroTime(p, true)

      this.$set(this.history, 'current', GV.cloneDeep(p))
    },
    goahead() {
      if (!this.history.future.length) return

      this.toward = 'right'
      this.history.past.push(this.history.current)

      let p = this.history.future.pop()

      this.HeroTime(p)
      this.$set(this.history, 'current', GV.cloneDeep(p))
    },
    getEL(hid, clone = '') {
      if (clone) {
        return document.querySelector('[hid="' + hid + '"][clone="' + clone + '"]')
      } else {
        return document.querySelector('[hid="' + hid + '"]')
      }
    },
    getELS(hid) {
      return Array.from(document.querySelectorAll('[hid="' + hid + '"]'))
    },
    cleanHero() {
      this.$set(this.history, 'currentTags', {})
      this.$set(this.history, 'returnTags', {})
    },
    HeroAction(el, ps, config, before, complete) {
      try {
        if (!el.getAttribute('hid')) return
      } catch (e) {
        console.warn(e)

        this.cleanHero()
        return complete()
      }

      flying = Hero.copy2Global(el, 1)

      if (!flying) return

      FN.PS.subscribeOnce(ps + 'calcDone', (msg, IFstyle) => {
        let tel = this.getEL(IFstyle.hid, IFstyle.clone)
        shadow = Hero.copy2Global(tel, 1, config.delta)

        if (!shadow) return
        if (!flying) return

        before(IFstyle)
        // shadow.hero
        flying.oel.style.visibility = 'hidden'

        flying.hero.setAttribute('style', shadow.hero.getAttribute('style'))
        shadow.hero.style.visibility = 'hidden'
        flying.hero.style.transition = `all ${config.during}ms ${config.curve || 'ease'}`

        setTimeout(() => {
          this.cleanHero()
          complete()
        }, config.during)
      })
    },
    HeroTime(data, reverse = false) {
      this.cleanHero()

      FN.PS.publishSync('cheanHero')

      let { target, transition } = data
      let tags

      let wrapRect = document.body.getBoundingClientRect()
      let delta

      let futureList = this.history.future
      if (this.toward == 'left' && futureList.length > 0) {
        let future = futureList[futureList.length - 1]

        transition = future.transition
      }

      if (transition == 'slide') {
        delta = wrapRect.width * (reverse ? -1 : 1)
      }

      if (reverse) {
        let last = this.history.current.target
        let back_config = data.tmap || {}
        let back_tags = Object.keys(back_config)
        let last_tags = Object.keys(this.history.heroTagsMap[last] || {})

        let returnTags = {}

        tags = last_tags.filter((v) => back_tags.includes(v))

        tags.forEach((tag) => {
          let { hero, clone = '', during, curve, back, reverse } = back_config[tag]

          if (!reverse) return

          let hcid = hero + clone

          returnTags[hcid] = tag

          this.HeroAction(
            this.getEL(back),
            hcid,
            { during, curve, delta },
            (n) => n,
            () => {
              this.$delete(this.history.returnTags, hcid)
            }
          )
        })

        this.$set(this.history, 'returnTags', returnTags)
      } else {
        let from_config = this.history.current.tmap || {}
        let from_tags = Object.keys(from_config)
        let to_config = this.history.heroTagsMap[target] || {}
        let to_tags = Object.keys(to_config)

        tags = to_tags.filter((v) => from_tags.includes(v))

        let currentTags = {}

        if (tags.length) {
          tags.forEach((tag) => {
            let { hero, clone = '', during, curve } = from_config[tag]

            currentTags[tag] = true

            this.HeroAction(
              this.getEL(hero, clone),
              to_config[tag],
              { during, curve, delta },
              (IFstyle) => {
                from_config[tag].back = IFstyle.hid
              },
              () => {
                this.$delete(this.history.currentTags, tag)
              }
            )
          })

          this.$set(this.history, 'currentTags', currentTags)
        }
      }
    },
    updateModelSubscription() {
      let newVal = this.$store.state.models

      Object.keys(newVal).forEach((id) => {
        if (newVal[id]) {
          let { id: pid } = newVal[id]

          if (!FLOW_CACHE[pid]) {
            FLOW_CACHE[pid] = new Rx.BehaviorSubject(undefined)
          }
        }
      })
    },
    fxRouterChange(data) {
      this.cleanHero()

      this.toward = 'right'

      data.timestamp = new Date().getTime()

      if (!data.replace) {
        this.history.past.push(this.history.current)
      }

      this.HeroTime(data)
      this.routechange(this.history.current.target, data.target)
      this.$set(this.history, 'current', GV.cloneDeep(data))
      this.$set(this.history, 'future', [])

      setTimeout(() => {
        if (data.replace) {
          this.$router.replace('/' + data.target)
        } else {
          this.$router.push('/' + data.target)
        }
      }, 17)
    },
  },
  mounted() {
    this.history.current.target = this.pid

    this.updateModelSubscription()

    FN.PS.subscribe('routerBeforeEach', (msg, data) => {
      let { pid: tid } = data.to.meta

      // https://developer.mozilla.org/zh-CN/docs/Web/API/History/state
      let time = history.state ? parseInt(history.state.key) : 0

      if (this.history.current.target != tid) {
        if (time > T) {
          this.goahead()
        } else {
          this.goback()
        }
      }

      T = time
    })

    FN.PS.subscribe('Fx_router_change', (msg, data) => {
      this.fxRouterChange(data)
    })

    FN.PS.subscribe('Fx_router_go', (msg, data) => {
      let step = Number(data.param)

      log('Fx_router_go', data, step)

      this.$router.go(step)
    })

    const getActiveMetaState = (hid) => {
      let target = this.SETS[hid]

      if (!target) {
        warn(hid, 'target not find')
      }

      return FN.GET_META_STATE(target)
    }

    const setTransition = (data, target, during, curve) => {
      let els = this.getELS(target)

      if (!els.length) {
        return warn(target, 'is unfinded')
      }

      let record = []

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

    FN.PS.subscribe('Fx_statu_change', (msg, data) => {
      let { hid, target, state, stateA, stateB, during, curve } = data

      target = FN.parseModelStr(target, hid)

      let curr = this.SETS[target]

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

      let curr = this.SETS[realTarget]

      if (subState) {
        let selected = curr.status.filter((statu) => statu.id == subState)[0]

        if (selected) selected.active = active
      }
    })

    FN.PS.subscribe('Fx_editStatu', (msg, data) => {
      let { hid, target, state, key, value } = data

      target = FN.parseModelStr(target, hid)

      let curr = this.SETS[target]

      if (!curr) return warn('curr is invalid', data, target, curr)
      if (!state) return

      let selected = curr.status.filter((statu) => statu.id == state)[0]

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

    FN.PS.subscribe('Fx_animate', (msg, data) => {
      let { hid, target, frames, during, delay, curve, loop } = data

      if (!frames.length) return

      target = FN.parseModelStr(target, hid)

      let els = this.getELS(target)

      if (!els.length) {
        return warn(target, 'is invalid')
      }

      let ani = FN.anime({
        targets: els,
        keyframes: frames,
        duration: during,
        delay: FN.anime.stagger(delay),
        easing: curve,
        loop,
        complete: () => {
          warn('Fx_animate complete')
          data.next('animate done!')
        },
      })
      window.aniList[hid] = ani
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

      if (state) {
        let selected = curr.status.filter((statu) => statu.id == state)[0]

        if (!selected) return warn('state is invalid', data, state)

        OBJ = selected.style

        let tv = OBJ[key]

        if (typeof tv == 'number') {
          ov = tv
          unit = 0
        } else {
          ;[ov, unit] = FN.parseNumberUnit(tv)
        }

        writer = (V) => this.$set(OBJ, key, V + unit)
      } else {
        ;[ov, unit] = FN.parseNumberUnit(curr.model[key].value)

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
        spx = MOUSE.dx - ldx
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

      if (state) {
        let selected = curr.status.filter((statu) => statu.id == state)[0]

        if (!selected) return warn('state is invalid', data, state)

        OBJ = selected.style

        let tv = OBJ[key]

        if (typeof tv == 'number') {
          ov = tv
          unit = 0
        } else {
          ;[ov, unit] = FN.parseNumberUnit(tv)
        }

        writer = (V) => this.$set(OBJ, key, V + unit)
      } else {
        ;[ov, unit] = FN.parseNumberUnit(curr.model[key].value)

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

    FN.PS.subscribe('Fx_setCPA', (msg, data) => {
      let { hid, target, tag, during, curve, reverse, clone } = data

      target = FN.parseModelStr(target, hid)

      if (!this.history.current.tmap) {
        this.history.current.tmap = {}
      }
      this.history.current.tmap[tag] = {
        hero: target,
        clone,
        during,
        curve,
        reverse,
      }
    })
  },
}
</script>
