<template>
  <transition
    appear
    name="custom-classes-transition"
    :enter-active-class="hookEnterActive()"
    :leave-active-class="hookLeaveActive()"
  >
    <view
      class="U-container"
      v-if="canRender() && !useScroll"
      :hid="hid"
      :clone="clone"
      :style="STYLE"
      :class="CLASS"
    >
      <slot v-if="!useScroll"></slot>
    </view>
    <scroll-view
      class="U-container"
      :hid="hid"
      :clone="clone"
      :style="STYLE"
      :class="CLASS"
      v-else-if="canRender() && useScroll"
      :scrollX="usx"
      :scrollY="usy"
      :scrollLeft="scrollLeft"
      :scrollTop="scrollTop"
      :scrollWithAnimation="true"
      :enableFlex="true"
    >
      <slot></slot>
    </scroll-view>
  </transition>
</template>

<script>
import scrollMix from './scroll.mix'

export default {
  mixins: [scrollMix],
}
</script>
