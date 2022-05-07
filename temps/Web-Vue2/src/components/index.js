import Vue from 'vue'

import COM from './IFcomponents'

COM.fillPrefix(['IFcontainer', 'IFlevel', 'IFcanvas']).forEach(key => {
  Vue.component(key, {
    template: COM[key],
    mounted: COM.ready
  })
})

COM.fillPrefix(['IFicon']).forEach(key => {
  Vue.component(key, {
    template: COM[key],
    computed: {
      VB() {
        return this.GET('viewBox') || '0 0 48 48'
      },
      d() {
        return this.GET('d').split('|')
      }
    }
  })
})

COM.fillPrefix(['IFinput', 'IFtextarea']).forEach(key => {
  Vue.component(key, {
    template: COM[key],
    methods: {
      input(e) {
        this.UPDATE("inputValue", e.target.value)
  
        this.$emit("input", e)
      },
      change(e) {
        this.UPDATE("value", e.target.value)
      }
    },
  })
})

COM.fillPrefix(['IFvideo']).forEach(key => {
  Vue.component(key, {
    template: COM[key],
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
      }
    },
    watch: {
      state() {
        let el = this.$refs.video
        if (!this.reflect) return
  
        if (this.state == 'play' && !this.GET('autoplay')) {
          el.play()
        }
  
        if (this.state == 'pause') {
          el.pause()
        }
      },
      seek(newVal) {
        let el = this.$refs.video
        if (!el || !this.reflect) return

        if (this.state == 'play') {
          el.currentTime = newVal
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
  
        let el = this.$refs.video

        if (el) {
          if (type == 'play') {
            el.currentTime = this.seek
          } else {
            this.UPDATE('seek', el.currentTime)
          }
        }
  
        setTimeout(() => {
          this.reflect = true
        }, 17)
  
        this.$emit(type, e)
      }
    },
  })
})

COM.fillPrefix(['IFiframe', 'IFhtml', 'IFmirror', 'IFphoto', 'IFlink', 'IFtext']).forEach(key => {
  Vue.component(key, {
    template: COM[key]
  })
})