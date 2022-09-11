<template>
  <transition name="fade">
    <view class="E-debug-cursor" :style="calcStyle" v-show="global.useRunCases"></view>
  </transition>
</template>

<script lang="ts">
import { $store } from '../store/index'
export default {
  computed: {
    calcStyle() {
      let { x, y, useTransition } = this.global.previewCursor

      return {
        left: x + 'px',
        top: y + 'px',
        display: 'block',
        transition: useTransition ? 'all 0.3s ease' : 'none',
        transitionDuration: useTransition ? '0.3s' : '0s'
      }
    },
    global() {
      return $store.history
    }
  },
}
</script>
<style>
.E-debug-cursor {
  position: absolute;
  width: 20px;
  height: 20px;
  display: none;
  margin-left: -10px;
  margin-top: -10px;
  border-radius: 10px;
  background-color: #fff;
  z-index: 999;
  background-color: rgba(253, 242, 36, 0.6);
  pointer-events: none;
}
</style>
