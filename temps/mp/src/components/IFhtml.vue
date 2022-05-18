<template>
  <rich-text
    class="U-html"
    v-if="canRender()"
    :hid="hid"
    :clone="clone"
    :style="STYLE"
    :nodes="nodes"
  ></rich-text>
</template>
<script>
export default {
  computed: {
    nodes() {
      let str = this.GET('html')
      let color = this.STYLE.color
      let textDecoration = this.STYLE.textDecoration || 'underline'

      //绕过小程序主题色限制
      str = str
        .replace(/\<p/g, `<p style="color: ${color};font-family: inherit"`)
        .replace(/\<a/g, `<a style="color: #1E88E5;"`)
        .replace(/\<u\>/g, `<u style="text-decoration: ${textDecoration}">`)

      return str
    },
  },
}
</script>
