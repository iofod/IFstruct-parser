<template>
  <transition
    appear
    name="custom-classes-transition"
    :enter-active-class="hookEnterActive()"
    :leave-active-class="hookLeaveActive()"
  >
    <view
      class="U-container"
      v-if="canRender()"
      :hid="hid"
      :clone="clone"
      :style="STYLE"
      :class="CLASS"
    >
      <slot></slot>
    </view>
  </transition>
</template>

<script>
import ready from './_ready'

export default {
  mounted: ready,
}
</script>
