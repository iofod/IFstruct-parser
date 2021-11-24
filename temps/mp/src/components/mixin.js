import FN from '../common/FN'
import UT from '../common/UT'
import { mapState } from 'vuex'

function calcCloneIndex(hid, clone, index) {
	if (clone && clone.includes('|')) {
		FN.setCurrentClone(hid, clone)

		index = parseInt(clone.split('|').reverse()[0]) // 这里要保持数据类型一样为字符串
	}

	return index
}

const onceCaller = {}

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
		APP() {
			return this.$store.state.app
		},
		SETS() {
			return this.$store.state.sets
		},
		IT() {
			return this.SETS[this.hid]
		},
		STYLE() {
			let item = this.IT
			if (!item) return ''

			// return this.AP.mixin
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
			let activeList = item.status.filter((state) => state.active)
			let clone = this.clone

			let metaState
			let metaName
			let activeFilterStates = []
			let filters = []

			// 将元状态和筛选器分组
			activeList.forEach((state) => {
				if (state.name.includes(':')) {
					activeFilterStates.push(state)
					filters.push(state.name)
				} else {
					metaState = state
					metaName = state.name
				}
			})

			let mixinList = []
			let calcProps = {}
			let mixinCustomKeys = [ {} ]
			let mixinStyles = []

			// 判断是否启动筛选
			let cloneArr = clone ? clone.split('|').slice(1) : [ '0' ] // |$|$ => [$, $]

			filters.forEach((filter, F) => {
				let nameArr = filter.split(':')
				let name = nameArr[0]

				// 去掉不是针对该元状态下的筛选器
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
							// 判断 query 表达式 是否匹配，不匹配则中断循环
							// 将 this 指向 item 即 => this.SETS[hid]
							if (!FN.subExpCheck(exp, curr, I, hid)) {
								return
							}
						} else {
							break
						}
					}

					// 1. 完全匹配  2. 或者泛匹配
					let validProps = activeFilterStates[F]
					mixinList.push(validProps)
					mixinCustomKeys.push(validProps.custom)
					mixinStyles.push(validProps.style)
				}
			})

			calcProps = mixinList[mixinList.length - 1] || metaState // hack: 如果无任何筛选，则不适用筛选
			//=========== 开始最终混合计算，得出最终 props =============
			let customKeys = Object.assign(...mixinCustomKeys, calcProps.custom || {})
			let style = {  ...mixinStyles, ...calcProps.style }
			let mixin = {}

			// 解析 customKeys 内使用的表达式
			for (let ckey in customKeys) {
				let ckv = FN.parseModelExp(customKeys[ckey], hid)

				mixin[ckey] =  typeof ckv == 'string' && ckv.endsWith('px') && !ckv.startsWith('#') ? FN.px2any(ckv) : ckv
			}
			if (item.layout) {
				let layout = item.layout || {}

				for (let lk in layout) {
					mixin[lk] = layout[lk]
				}
			}

			let { x, y, d, s } = style

			style.left = x * 2 + 'rpx'
			style.top = y * 2 + 'rpx'
			// 字节  QQ 微信 支付宝 百度 都是 rpx，快应用是px单位，后期进行另外处理
			style.transform = s ? `rotate(${d}deg) scale(${s / 100})` : `rotate(${d}deg)`

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
		...mapState({
			app: state => state.app,
			lockScroll: state => state.app.lockScroll,
      history: state => state.history
    })
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

				callback.fnName = fn.name
	
				return callback
			}

			return n => n
		},
		canRender() {
			let hid = this.hid
			let item = FN.SETS(hid)

			if (!item) {
				log('error::hid', hid)

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
