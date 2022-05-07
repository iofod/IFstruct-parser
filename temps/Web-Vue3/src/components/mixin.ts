import FN from '../common/FN'
import { $store } from '../store'
import { IFstate, GlobalObject } from './type.d'
import calcLeftTop from './client.polyfill'

function calcUnit(n: any) {
  return n / 50 + 'rem'
}

function px2any(str: string, m = ' ') {
  if (str.includes(m)) {
    return str
      .split(m)
      .map((v) => {
        let i = v.indexOf('px')

        return i > 0 ? calcUnit(v.substring(0, i)) : v
      })
      .join(m)
  } else {
    return calcUnit(str.substring(0, str.length - 2))
  }
}

export default {
  props: {
    hid: {
      type: String,
    },
    clone: {
      type: String,
      required: false,
      default: '',
    },
  },
  computed: {
    APP() {
      return this.$store.app
    },
    SETS() {
      return this.$store.sets
    },
    IT() {
      return this.SETS[this.hid]
    },
    LAYOUT() {
      let obj = this.IT || {}

      return obj.layout
    },
    STYLE() {
      if (!this.SETS[this.hid]) return ''

      let style = {
        ...this.AP.style,
        ...this.AP.mixin,
      }

      return style
    },
    AP() {
      let hid = this.hid
      let SETS = this.SETS
      let item = SETS[hid]
      let activeList = item.status.filter((state) => state.active)
      let clone = this.clone

      let metaState
      let metaName
      let activeFilterStates: IFstate[] = []
      let filters: string[] = []

      activeList.forEach((state: IFstate) => {
        if (state.name.includes(':')) {
          activeFilterStates.push(state)
          filters.push(state.name)
        } else {
          metaState = state
          metaName = state.name
        }
      })

      let mixinList: IFstate[] = []
      let calcProps: GlobalObject = {}
      let mixinCustomKeys: GlobalObject[] = []
      let mixinStyles: GlobalObject[] = []

      let cloneArr = clone ? clone.split('|').slice(1) : ['0'] // |$|$ => [$, $]

      filters.forEach((filter, F) => {
        let nameArr = filter.split(':')
        let name = nameArr[0]

        if (name != metaName) return

        let expArr = nameArr.slice(1) // exps => [exp, exp]

        if (expArr.length) {
          let curr
          let I
          let L = cloneArr.length
          let exp

          for (I = 0; I < L; I++) {
            curr = cloneArr[I]
            exp = expArr[I]

            if (exp) {
              if (!FN.subExpCheck(exp, curr, I, hid)) {
                return
              }
            } else {
              break
            }
          }

          let validProps = activeFilterStates[F]
          mixinList.push(validProps)
          mixinCustomKeys.push(validProps.custom)
          mixinStyles.push(validProps.style)
        }
      })

      calcProps = mixinList[mixinList.length - 1] || metaState
      let customKeys = Object.assign({}, ...mixinCustomKeys, calcProps.custom)
      let style = Object.assign({}, ...mixinStyles, calcProps.style)
      let mixin = {}

      for (let ckey in customKeys) {
        let ckv = FN.parseModelExp(customKeys[ckey], hid)

        mixin[ckey] =
          typeof ckv == 'string' && ckv.endsWith('px') && !ckv.startsWith('#')
            ? px2any(ckv)
            : ckv
      }

      let { d, s } = style

      calcLeftTop(style)

      style.transform = s ? `rotate(${d}deg) scale(${s / 100})` : `rotate(${d}deg)`

      // The initial value of the zIndex of the static element defaults to 0 if it is not overridden.
      if (style.position == 'static' && style.zIndex === undefined) {
        style.zIndex = 0
      }

      delete style.x
      delete style.y
      delete style.d
      delete style.s

      let tag = item.model.tag
      if (tag && tag.value && this.history.currentTags[tag.value]) {
        FN.PS.publish(hid + 'calcDone', { hid, clone, style, transform: style.transform })

        style.visibility = 'hidden'
        style.transform = ''
      }

      if (this.history.returnTags[hid + clone]) {
        FN.PS.publish(hid + clone + 'calcDone', { hid, clone, style, transform: style.transform })

        style.visibility = 'hidden'
        style.transform = ''
      }

      return {
        style,
        mixin,
        IAA: calcProps.IAA,
        IAD: calcProps.IAD,
      }
    },
    $store() {
      return $store
    },
    history() {
      return this.$store.history
    },
  },
  methods: {
    INIT_MODEL() {},
    GET(key) {
      if (!this.IT) return ''

      let arr = FN.GET_MODEL(this.hid)(key, FN.tfClone(this.clone))
      let v = FN.parseModelExp(Array.isArray(arr) ? arr.toString() : arr, this.hid, false)

      return v
    },
    UPDATE(key, value) {
      FN.SET_MODEL(this.hid)(key, value, FN.tfClone(this.clone))
    },
    CID(hid, ...arg) {
      let item = this.SETS[hid]

      if (!item) return 0

      let cv = item.model.copy.value

      let p = cv

      if (Array.isArray(cv)) {
        ;[...arg].forEach((v) => {
          p = cv[v]
        })

        return Number(p) || 0
      } else {
        return Number(cv) || 0
      }
    },
    CLONE(I) {
      return (this.clone || '') + this.COPY > 0 ? '|' + I : ''
    },
    EV(event, efn, clone) {
      let index = 0

      let hid = efn.name.split('_').slice(1).join('_')

      if (clone && clone.includes('|')) {
        FN.setCurrentClone(hid, clone)

        index = parseInt(clone.split('|').reverse()[0])
      }

      event.context = {
        hid,
        clone,
        index,
        event,
        eventName: event.type,
        response: null,
      }
      event.hid = hid
      event.context.response = efn(event)

      return event.context
    },
    GEV(efn, clone = '') {
      let index = 0

      let hid = efn.name.split('_').slice(1).join('_')
      let useClone = clone && clone.includes('|')

      return (event, payload = {}) => {
        if (useClone) {
          FN.setCurrentClone(hid, clone)

          index = parseInt(clone.split('|').reverse()[0])
        }
        // modelchange, routechange... customEvent
        let eventName

        if (typeof event == 'string') {
          if (event == 'routechange') {
            eventName = 'routechange'
            event = {
              hid,
              value: payload,
            }
          } else {
            let [_, model] = event.split('.')
            eventName = 'modelchange'
            event = {
              hid,
              value: model,
            }
          }

          event.context = {
            hid,
            clone: 0,
            index,
            event,
            eventName,
            response: null,
          }
        } else {
          event.context = {
            hid,
            clone,
            index,
            event,
            eventName: event.gesture ? event.gesture.event[0] : event.type,
            response: null,
          }
          event.hid = hid
        }

        event.context.response = efn(event)
      }
    },
    canRender() {
      let hid = this.hid
      let item = FN.SETS(hid)

      if (!item) return false

      if (!item.model.render) return true

      let render = FN.GET_MODEL(hid)('render', FN.tfClone(this.clone))
      let flag = FN.arrFirst(render)

      if (typeof flag == 'string') {
        flag = FN.parseModelExp(flag, hid, false)
      }

      if (flag === true || flag === 'true') {
        return true
      }

      return false
    },
    hookEnterActive() {
      let ani = this.AP.IAA

      return ani ? ani + 'IA' : ''
    },
    hookLeaveActive() {
      let ani = this.AP.IAD

      return ani ? ani + 'IA' : ''
    },
  },
}
