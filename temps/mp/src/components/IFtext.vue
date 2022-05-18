<template>
  <view class="U-text" v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE">{{
    GET('msg')
  }}</view>
</template>
