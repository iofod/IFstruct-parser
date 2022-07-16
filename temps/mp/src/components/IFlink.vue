<template>
  <rich-text
    class="U-link"
    v-if="canRender()"
    :hid="hid"
    :clone="clone"
    :style="STYLE"
    :class="CLASS"
    :nodes="nodes"
  ></rich-text>
</template>
<script>
export default {
  computed: {
    nodes() {
      let str = this.GET('msg')
      let link = this.GET('link')
      let color = this.STYLE.color || '#1E88E5'

      return `<a style="color: ${color};" href="${link}" target="_blank">${str}</a>`

      return str
    },
  },
}
</script>
