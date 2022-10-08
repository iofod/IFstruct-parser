<template>
  <transition
    appear
    name="custom-classes-transition"
    :enter-active-class="hookEnterActive()"
    :leave-active-class="hookLeaveActive()"
  >
    <scroll-view
      class="wrap" v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE" :class="CLASS"
      :scrollX="false"
      :scrollY="!lockScroll"
      :scrollTop="scrollTop"
      :scrollWithAnimation="true"
      @scroll="scroll"
      style="height: 100%"
    >
      <slot></slot>
    </scroll-view>
  </transition>
</template>

<script>
import FN from '../common/FN'
import scrollMix from './scroll.mix'

export default {
  methods: {
    scroll(e) {
      // v-GT 指令添加的内容要防止滚动触发
      FN.PS.publishSync('scrollView')
    },
  },
  mixins: [scrollMix]
}
</script>
