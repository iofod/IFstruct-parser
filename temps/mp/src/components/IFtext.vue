<template>
  <view class="U-text" v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE" :class="CLASS">{{
    GET('msg')
  }}</view>
</template>
