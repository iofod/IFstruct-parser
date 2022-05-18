<template>
  <input
    class="U-input"
    v-if="canRender()"
    :hid="hid"
    :clone="clone"
    :style="STYLE"
    :type="GET('type') || 'text'"
    :password="GET('type') == 'password'"
    :placeholder="GET('placeholder')"
    :disabled="!!GET('disabled')"
    :maxlength="GET('maxlength') || 9e9"
    :value="GET('value')"
    :focus="!!GET('autofocus')"
    @input="input"
    @blur="change"
  />
</template>
<script>
import FN from '../common/FN'

export default {
  methods: {
    input(e) {
      this.UPDATE('inputValue', e.target.value)

      this.$emit('input', e)
    },
    change(e) {
      let nv = e.target.value
      let ov = this.GET('value')

      if (ov != nv) {
        this.UPDATE('value', e.target.value)

        this.$emit('change', e)
      }
    },
  },
}
</script>
