<template>
  <view class="U-iframe" v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE" :class="CLASS">
    <!-- 小程序下直接铺满 -->
    <web-view :src="GET('src')" />
  </view>
</template>
