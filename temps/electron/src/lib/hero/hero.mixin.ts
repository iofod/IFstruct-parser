import FN from '../../common/FN'
import GV from '../GV'
import Hero from './index'

let T = 0
let flying
let shadow

function getEL(hid, clone = '') {
  if (clone) {
    return document.querySelector('[hid="' + hid + '"][clone="' + clone + '"]')
  } else {
    return document.querySelector('[hid="' + hid + '"]')
  }
}

export default {
  methods: {
    cleanHero() {
      this.history.currentTags = {}
      this.history.returnTags = {}
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
        let tel = getEL(IFstyle.hid, IFstyle.clone)
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
          complete()
          this.cleanHero()
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
            getEL(back),
            hcid,
            { during, curve, delta },
            (n) => n,
            () => {
              delete this.history.returnTags[hcid]
            }
          )
        })

        this.history.returnTags = returnTags
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
              getEL(hero, clone),
              to_config[tag],
              { during, curve, delta },
              (IFstyle) => {
                from_config[tag].back = IFstyle.hid
              },
              () => {
                delete this.history.currentTags[tag]
              }
            )
          })

          this.history.currentTags = currentTags
        }
      }
    },
    goback() {
      this.cleanHero()

      if (!this.history.past.length) return

      this.toward = 'left'
      this.history.future.push(this.history.current)

      let p = this.history.past.pop()

      this.HeroTime(p, true)
      this.history.current = GV.cloneDeep(p)
    },
    routechange(from, to) {
      FN.PS.publish('routechange', { from, to })
    },
    goahead() {
      if (!this.history.future.length) return

      this.toward = 'right'
      this.history.past.push(this.history.current)

      let p = this.history.future.pop()

      this.HeroTime(p)
      this.history.current = GV.cloneDeep(p)
    },
    initHeroListener() {
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

        this.APP.currentPage = tid

        T = time
      })

      FN.PS.subscribe('Fx_router_change', (msg, data) => {
        this.toward = 'right'

        data.timestamp = new Date().getTime()

        if (!data.replace) {
          this.history.past.push(this.history.current)
        }

        this.HeroTime(data)
        this.routechange(this.history.current.target, data.target)
        this.history.current = GV.cloneDeep(data)
        this.history.future = []

        setTimeout(() => {
          if (data.replace) {
            this.$router.replace('/' + data.target)
          } else {
            this.$router.push('/' + data.target)
          }
        }, 17)
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
    }
  }
}
