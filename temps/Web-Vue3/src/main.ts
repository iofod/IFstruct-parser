import { createApp } from 'vue'
import { setupStore } from './store'
import router from './router'
import mixin from './components/mixin'
import { $store } from './store'
import FN from './common/FN'
import UT from './common/UT'
import App from './App.vue'
import registerCOM from './components'
import setDirective from './lib/better-gesture/vue-better-gesture'
import GV from './lib/GV'
import './style/common.less'
import './common/mouse'
import { createListener } from './lib/auto/index'

;(window as any).SDK = FN.SDK()
;(window as any).GV = GV

const VM = createApp(App)

registerCOM(VM)
setDirective(VM)
setupStore(VM)

router.beforeEach((to, from, next) => {
  FN.PS.publishSync('routerBeforeEach', { from, to })

  document.title = String(to.meta.title || '')

  setTimeout(() => {
    $store.app.currentPage = to.meta.pid as string

    next()
  }, 17)
})

;(window as any).UT = UT
;(window as any).FN = FN

// vite development mode
if (import.meta.env.DEV) {
  ;(window as any).__VM__ = VM

  if (import.meta.env.VITE_UseAutoTestInDev == '1') {
    createListener()
  }
}

if (import.meta.env.VITE_UseAutoTestInProd == '1') {
  createListener()
}

FN.setVM(VM)

VM.mixin(mixin)
VM.use(router)
VM.mount('#app')
