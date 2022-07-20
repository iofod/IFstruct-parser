<template>
  <transition
    appear
    name="custom-classes-transition"
    :enter-active-class="hookEnterActive()"
    :leave-active-class="hookLeaveActive()"
  >
    <view
      class="U-text"
      v-if="canRender()"
      :hid="hid"
      :clone="clone"
      :style="STYLE"
      :class="CLASS"
      >{{ GET('msg') }}</view
    >
  </transition>
</template>
