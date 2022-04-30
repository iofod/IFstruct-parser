<template>
  <image
    class="U-photo"
    :src="GET('url')"
    :alt="GET('alt')"
    v-if="canRender()"
    :hid="hid"
    :clone="clone"
    :style="STYLE"
    :mode="mode"
  ></image>
</template>

<script>
// 该功能以 web 常用的几个为主，只保留四个
// https://developers.weixin.qq.com/miniprogram/dev/component/image.html
// https://taro-docs.jd.com/taro/docs/components/media/image
const FitMap = {
  contain: 'aspectFit',
  cover: 'aspectFill',
  fill: 'scaleToFill',
  none: 'center',
}

export default {
  computed: {
    mode() {
      let mode = this.STYLE.objectFit
      if (mode) {
        return FitMap[mode] || mode //高级用户可以强制变更类型为想要的
      } else {
        return 'aspectFit'
      }
    },
  },
}
</script>
