import { createApp } from 'vue'
import { setupStore } from './store'
import router from './router'
import mixin from './components/mixin'
import FN from './common/FN'
import UT from './common/UT'
import App from './App.vue'
import registerCOM from './components'
import setDirective from './lib/better-gesture/vue-better-gesture'
import GV from './lib/GV'
import './style/common.less'
import './common/mouse'

router.beforeEach((to, from, next) => {
  FN.PS.publishSync('routerBeforeEach', { from, to })

  document.title = String(to.meta.title || '')

  setTimeout(() => {
    next()
  }, 17)
})

;(window as any).SDK = FN.SDK()
;(window as any).GV = GV

const VM = createApp(App)

registerCOM(VM)
setDirective(VM)
setupStore(VM)

VM.mixin(mixin)
VM.use(router)
VM.mount('#app')

;(window as any).UT = UT
;(window as any).FN = FN

// vite development mode
if (import.meta.env.DEV) {
  ;(window as any).__VM__ = VM
}
