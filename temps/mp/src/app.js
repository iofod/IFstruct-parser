import Vue from 'vue'
import store from './store/index'
import mixin from './components/mixin'

import './style/common.less'
import './components/base'

// Vue.config.productionTip = false
Vue.mixin(mixin)

import './common/vue-better-gesture'
import './mouse'

const App = {
  store,
  onShow (options) {
  },
  render(h) {
    return h('block', this.$slots.default)
  }
}

export default App
