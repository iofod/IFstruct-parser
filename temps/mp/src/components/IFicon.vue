<template>
  <transition
    appear
    name="custom-classes-transition"
    :enter-active-class="hookEnterActive()"
    :leave-active-class="hookLeaveActive()"
  >
    <view class="U-icon" v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE" :class="CLASS">
      <view class="U-icon-view" :style="svg"></view>
    </view>
  </transition>
</template>
<script>
import FN from '../common/FN'

export default {
  computed: {
    svg() {
      let VB = this.GET('viewBox') || '0 0 48 48'
      let fill = this.STYLE.fill || '#000'
      let path = this.GET('d')
        .split('|')
        .map((d) => `<path d="${d}" fill="${fill}"></path>`)
        .join('')
      let src =
        'data:image/svg+xml;base64,' +
        FN.Base64.encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}">${path}</svg>`)

      return {
        backgroundImage: `url("${src}")`,
        backgroundSize: 'contain',
        backgroundPosition: 'center center',
      }
    },
  },
}
</script>
