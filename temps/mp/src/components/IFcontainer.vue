<template>
  <view
    class="U-container"
    v-if="canRender()"
    :hid="hid"
    :clone="clone"
    :style="STYLE"
  >
    <slot></slot>
  </view>
</template>

<script>
import ready from './_ready'

export default {
  mounted: ready
}
</script>
