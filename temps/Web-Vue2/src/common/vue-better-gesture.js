import Vue from 'vue'
import BetterGesture from './better-gesture.js'

let EV_Directive = ['tap', 'longtap', 'swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown', 'pressmove', 'rotate', 'pinch', 'start', 'end']

EV_Directive.forEach(eventName => {
  Vue.use({
    BetterGesture,
		install() {
			Vue.directive('GT-' + eventName, {
				bind: function(elem, binding) {
					let func = binding.value
					let oldFunc = binding.oldValue
          let cacheObj = elem.__betterGesture__

          if (cacheObj && cacheObj.gesture) {
            if (oldFunc) {
              cacheObj.gesture.off(eventName, oldFunc)
            }
            if (func) {
              cacheObj.gesture.on(eventName, func)
            }
          } else {
            elem.__betterGesture__ = new BetterGesture(elem, {
              eventName,
              [eventName]: func,
              modifiers: binding.modifiers
            })
          }
				},
				unbind: function(elem) {
          let cacheObj = elem.__betterGesture__

          if (cacheObj && cacheObj.gesture) {
            cacheObj.gesture.destroy()
          }
				}
			})
		}
  })
})
