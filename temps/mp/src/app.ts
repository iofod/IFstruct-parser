import { createApp } from 'vue'
import { setupStore } from './store'
import mixin from './components/mixin'
import registerCOM from './components/base'
import setDirective from './lib/better-gesture/vue-better-gesture'
import { createListener } from './lib/auto/index'

import './style/common.less'
import './mouse'

const VM = createApp({
  onShow(options) {
  },
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})

registerCOM(VM)
setDirective(VM)
setupStore(VM)

VM.mixin(mixin)

if (process.env.UseAutoTest) {
  createListener()
}

export default VM
