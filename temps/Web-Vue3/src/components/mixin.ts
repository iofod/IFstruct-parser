import FN from '../common/FN'
import { $store } from '../store'
import { IFstate, GlobalObject } from './type.d'
import { calcRect, LAYOUT, px2any, calcUnit } from './client.polyfill'

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
    LAYOUT,
    STYLE() {
      if (!this.SETS[this.hid]) return ''

      return this.AP.style
    },
    AP() {
      let hid = this.hid
      let item = this.SETS[hid]
      let clone = this.clone
			let metaName
			let activeStateList: IFstate[] = []
    	let mixinStateList: IFstate[] = []

      item.status.forEach(state => {
				if (!state.active) return
	
				let { name } = state
	
				if (name.includes(':')) return activeStateList.push(state)
	
				if (name == '$mixin') {
					activeStateList.push(state)
	
					if (!metaName) mixinStateList.push(state)
					
					return
				}
	
				if (metaName) return console.warn('meta is repeat', state)
	
				metaName = name
				activeStateList = [...mixinStateList, state]
				mixinStateList = []
			})

      let propsList: IFstate[] = []

      let cloneArr = clone ? clone.split('|').slice(1) : ['0'] // |$|$ => [$, $]

      activeStateList.forEach((subState) => {
				if (subState.name == '$mixin' || !subState.name.includes(':')) {
					return propsList.push(subState)
				}
	
				let nameArr = subState.name.split(':')
				let name = nameArr[0]

				if (name != metaName) return

				let expArr = nameArr.slice(1) // exps => [exp, exp]

				if (!expArr.length) return

				let curr
				let I
				let L = cloneArr.length
				let exp

				for (I = 0; I < L; I++) {
					curr = cloneArr[I]
					exp = expArr[I]

					if (exp) {
						if (!FN.subExpCheck(exp, curr, I, hid)) return
					} else {
						break
					}
				}

				propsList.push(subState)
			})

      let customKeyList: GlobalObject[] = []
      let mixinStyles: GlobalObject[] = []
			let x = 0
			let y = 0
      let tx = 0
    	let ty = 0
			let d = 0
			let s = 100

			propsList.forEach(props => {
				if (props.custom) customKeyList.push(props.custom)

				let { style } = props

				mixinStyles.push(style)

				if (style.x !== undefined) x = style.x
				if (style.y !== undefined) y = style.y
        if (style.tx !== undefined) tx = style.tx
      	if (style.ty !== undefined) ty = style.ty
				if (style.d !== undefined) d = style.d
				if (style.s !== undefined) s = style.s
			})

      let calcProps = propsList[propsList.length - 1] 
			let customKeys = Object.assign({}, ...customKeyList)
			let style = Object.assign({}, ...mixinStyles)
			let mixin = {}

      for (let ckey in customKeys) {
        let ckv = FN.parseModelExp(customKeys[ckey], hid)

        mixin[ckey] =
          typeof ckv == 'string' && ckv.endsWith('px') && !ckv.startsWith('#')
            ? px2any(ckv)
            : ckv
      }

      style.x = x
			style.y = y

      calcRect(style, x, y, tx, ty)

			// The initial value of the zIndex of the static element defaults to 0 if it is not overridden.
			if (style.position == 'static' && style.zIndex === undefined) {
				style.zIndex = 0
			}

			delete style.x
			delete style.y

      style = {
        ...style,
        ...mixin,
      }

      let tfStr = ``

      if (style.perspectValue) {
        tfStr += ` perspective(${calcUnit(Number(style.perspectValue) * 10)})`
  
        if (style.rotateX) tfStr += ` rotateX(${style.rotateX}deg)`
    
        if (style.rotateY) tfStr += ` rotateY(${style.rotateY}deg)`
      }
  
      if (style.scaleX || style.scaleY || style.scaleZ) {
        if (style.scaleX) tfStr += ` scaleX(${Number(style.scaleX) / 100})`
        if (style.scaleY) tfStr += ` scaleY(${Number(style.scaleY) / 100})`
        if (style.scaleZ) tfStr += ` scaleZ(${Number(style.scaleZ) / 100})`
      } else {
        tfStr += ` scale(${s / 100})`
      }
  
      tfStr += ` rotateZ(${d}deg)`
  
      if (style.skewX) tfStr += ` skewX(${style.skewX}deg)`
      if (style.skewY) tfStr += ` skewY(${style.skewY}deg)`
      if (style.translateX) tfStr += ` translateX(${calcUnit(style.translateX)})`
      if (style.translateY) tfStr += ` translateY(${calcUnit(style.translateY)})`
      if (style.translateZ) tfStr += ` translateZ(${calcUnit(style.translateZ)})`
  
      style.transform = tfStr

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
