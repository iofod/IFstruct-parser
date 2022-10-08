<template>
  <transition name="fade">
    <div class="E-debug-cursor" :style="calcStyle" v-if="global.useRunCases"></div>
  </transition>
</template>

<script>
import { mapState } from 'vuex'
export default {
  computed: {
    calcStyle() {
      let { x, y, useTransition } = this.global.previewCursor

      return {
        left: x + 'px',
        top: y + 'px',
        display: 'block',
        transition: useTransition ? 'all 0.3s ease' : 'none'
      }
    },
    ...mapState({
      global: (state) => state.history,
    }),
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
  background-color: #fdf22498;
  pointer-events: none;
}
</style>

