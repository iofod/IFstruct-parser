import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import mixin from './components/mixin'
import FN from './common/FN'
import UT from './common/UT'
import GV from './common/GV'

import './style/common.less'
import './components/index'

import "lb-toast/dist/index.css"
import Toast from "lb-toast"

FN.toast = Toast

window.alert = (str) => FN.toast.info(typeof str == 'string' ? str : JSON.stringify(str))

Vue.config.productionTip = false
Vue.mixin(mixin)

import './mouse'
import './common/vue-better-gesture'

router.beforeEach((to, from, next) => {
  FN.PS.publishSync('routerBeforeEach', { from, to })

  document.title = to.meta.title

  setTimeout(() => {
    next()
  }, 17)

})

const VM = new Vue({
  router,
  store,
  render: h => h(App)
})

window.Vue = Vue
window.__VM__ = VM
window.FORM = {}
window.__currentClone__ = {}
window.aniList = {}
window.FN = FN
window.UT = UT
window.GV = GV


window.$ds = document.documentElement.clientWidth / 375
window.addEventListener("resize", () => window.$ds = document.documentElement.clientWidth / 375, false);

import { BehaviorSubject } from "rxjs"

window.Rx = {
  BehaviorSubject
}

window.SDK = FN.SDK()

VM.$mount('#app')