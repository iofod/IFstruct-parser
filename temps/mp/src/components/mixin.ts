import FN from '../common/FN'
import { $store } from '../store'
import { IFstate, GlobalObject } from './type.d'
import { calcRect } from './client.polyfill'

function calcCloneIndex(hid, clone, index) {
	if (clone && clone.includes('|')) {
		FN.setCurrentClone(hid, clone)

		index = parseInt(clone.split('|').reverse()[0]) // 这里要保持数据类型一样为字符串
	}

	return index
}

const onceCaller = {}
const { px2any } = FN

export default {
	props: {
		hid: {
			type: String
		},
		clone: {
			type: String,
			required: false,
			default: ''
		}
	},
	computed: {
    app() {
      return this.$store.app
    },
    lockScroll() {
      return this.app.lockScroll
    },
		APP() {
      return this.$store.app
    },
    SETS() {
      return this.$store.sets
    },
    IT() {
      return this.SETS[this.hid]
    },
		STYLE() {
			if (!this.SETS[this.hid]) return ''

			let style = {
				...this.AP.style,
				...this.AP.mixin
			}

			return style
		},
		// active props
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

				metaName = state.name
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
			let s

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

      calcRect(style, x, y, tx, ty)

      let ts = s > 0 ? `scale(${s / 100})` : ''
			let tr = `rotate(${d}deg)`

			style.transform = tr + ' ' + ts

			// 不覆盖情况，static 元素的 zIndex 初始值则默认为 0
			if (style.position == 'static' && style.zIndex === undefined) {
				style.zIndex = 0
			}

			return {
				style,
				mixin,
				IAA: calcProps.IAA,
				IAD: calcProps.IAD
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

			let p = cv //游标，赋值容错

			if (Array.isArray(cv)) {
				;[ ...arg ].forEach((v) => {
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
		EV(event, efn, clone = '') {
			// 在这种情况下，滚动不应当发生
			if (event.defaultPrevented) {
				this.app.lockScroll = true
			}

			let hid = (efn.fnName || efn.name).split('_').slice(1).join('_') // id 的拼接规则如此
			let index = calcCloneIndex(hid, clone, 0)

			event.context = {
				hid,
				clone,
				index,
				eventName: event.type,
				event,
				response: null
			}
			event.hid = hid
			// 这一步的输出决定下一步的输入
			event.context.response = efn(event) //这个赋值response虽然暂时没用到

			return event.context
		},
		GEV(efn, clone = '') {
			let hid = (efn.fnName || efn.name).split('_').slice(1).join('_') // id 的拼接规则如此
			let index = calcCloneIndex(hid, clone, 0)

			return (event, payload = {}) => {
				// modelchange, routechange... customEvent
				let eventName

				if (typeof event == 'string') {

					if (event == 'routechange') {
						eventName = 'routechange'
						event = {
							hid,
							value: payload
						}
					} else {
						let [ _, model ] = event.split('.')
						eventName = 'modelchange'
						event = {
							hid,
							value: model
						}
					}

				} else {
					eventName = event.gesture ? event.gesture.event[0] : event.type
					event.hid = hid
				}

				event.context = {
					clone,
					index,
					hid,
					event,
					eventName,
					response: efn(event)
				}
			}
		},
		Once(fn, clone = '') {
			if (!onceCaller[fn.name + clone]) {
				onceCaller[fn.name + clone] = true

				let callback = function() {
					fn.apply(this, arguments)
				}

				// callback.fnName = fn.name

				return callback
			}

			return n => n
		},
		canRender() {
			let hid = this.hid
			let item = FN.SETS(hid)

			if (!item) {
				console.log('error::hid', hid)

				return false
			}

			// 无配置 render 的情况
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
		}
	}
}
