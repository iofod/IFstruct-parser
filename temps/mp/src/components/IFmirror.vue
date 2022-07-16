<template>
  <view class="U-mirror" v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE" :class="CLASS">
    <slot></slot>
  </view>
</template>
