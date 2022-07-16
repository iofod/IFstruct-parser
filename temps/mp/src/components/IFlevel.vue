<template>
  <transition
    appear
    name="custom-classes-transition"
    :enter-active-class="hookEnterActive()"
    :leave-active-class="hookLeaveActive()"
  >
    <view class="wrap" v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE" :class="CLASS">
      <scroll-view
        class="frame"
        :scrollX="false"
        :scrollY="!lockScroll"
        @scroll="scroll"
        style="height: 100%"
      >
        <slot></slot>
      </scroll-view>
    </view>
  </transition>
</template>

<script>
import FN from '../common/FN'
import ready from './_ready'

export default {
  methods: {
    scroll(e) {
      // v-GT 指令添加的内容要防止滚动触发
      FN.PS.publishSync('scrollView')
    },
  },
  mounted: ready,
}
</script>
