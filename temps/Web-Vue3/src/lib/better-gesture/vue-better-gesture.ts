import BetterGesture from './index.js'

let EV_Directive = [
  'tap',
  'longtap',
  'swipe',
  'swipeleft',
  'swiperight',
  'swipeup',
  'swipedown',
  'pressmove',
  'rotate',
  'pinch',
  'start',
  'end',
]

export default function setDirective(app) {
  EV_Directive.forEach((eventName) => {
    app.directive('GT-' + eventName, {
      beforeMount: function (elem, binding) {
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
            modifiers: binding.modifiers,
          })
        }
      },
      beforeUnmount: function (elem) {
        let cacheObj = elem.__betterGesture__

        if (cacheObj && cacheObj.gesture) {
          cacheObj.gesture.destroy()
        }
      },
    })
  })
}

