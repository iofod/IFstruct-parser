<template>
  <video class="U-video" 
    v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE"
    :id="hid + clone"
    :src="GET('url')"
    :autoplay="GET('autoplay')"
    :loop="GET('loop')"
    :muted="GET('muted')"
    :controls="!!GET('controls')"
    @play="handle"
    @pause="handle"
    @ended="handle"
    @waiting="handle"
    @error="handle"
    @timeupdate="handle"
  ></video>
</template>

<script>
import Taro from '@tarojs/taro'

export default {
  data() {
    return {
      reflect: true,
    }
  },
  computed: {
    state() {
      return this.GET('state')
    },
    seek() {
      return this.GET('seek')
    },
    video() {
      let id = this.hid + this.clone

      return Taro.createVideoContext(id)
    }
  },
  watch: {
    state() {
      let el = this.video
      if (!el || !this.reflect) return

      if (this.state == 'play' && !this.GET('autoplay')) {
        el.play()
      }

      if (this.state == 'pause') {
        el.pause()
      }
    },
    seek(newVal) {
      if (!this.reflect) return

      let el = this.video

      if (!el || !this.reflect) return

      // 只有播放的时候，进度修改才生效
      // 小程序上效果不好，不推荐使用
      if (this.state == 'play') {
        el.seek(newVal)
      }
    }
  },
  methods: {
    handle(e) {
      let { type } = e

      this.reflect = false

      if (type != 'timeupdate') {
        this.UPDATE('state', type)
      }

      let el = this.video

      if (el) {
        if (type == 'play') {
          el.seek(this.seek) //从设定的位置开始播放
        } else {
          let ct = e.detail.currentTime

          if (ct) {
            this.UPDATE('seek', ct)
          }
        }
      }

      setTimeout(() => {
        this.reflect = true
      }, 17)

      this.$emit(type, e)
    }
  }
}
</script>
