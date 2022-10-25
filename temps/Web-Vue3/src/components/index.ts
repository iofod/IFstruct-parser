import { App } from 'vue'
import COM from './IFcomponents'
import { Exterior } from './exterior'
import GV from '../lib/GV/index'
import scrollMix from './scroll.mix'

export default function registerCOM(app: App<Element>) {
  COM.fillPrefix(['IFlevel', 'IFcontainer']).forEach((key) => {
    app.component(key, {
      template: COM[key],
      mixins: [scrollMix],
    })
  })
  COM.fillPrefix(['IFcanvas']).forEach((key) => {
    app.component(key, {
      template: COM[key],
      mounted: COM.ready
    })
  })

  COM.fillPrefix(['IFicon']).forEach((key) => {
    app.component(key, {
      template: COM[key],
      computed: {
        VB() {
          return this.GET('viewBox') || '0 0 48 48'
        },
        d() {
          return this.GET('d').split('|')
        },
      },
    })
  })

  COM.fillPrefix(['IFinput', 'IFtextarea']).forEach((key) => {
    app.component(key, {
      template: COM[key],
      methods: {
        input(e) {
          this.UPDATE('inputValue', e.target.value)

          this.$emit('input', e)
        },
        change(e) {
          this.UPDATE('value', e.target.value)
        },
      },
    })
  })

  COM.fillPrefix(['IFvideo']).forEach((key) => {
    app.component(key, {
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
        },
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
        },
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
        },
      },
    })
  })

  COM.fillPrefix(['IFiframe', 'IFhtml', 'IFmirror', 'IFphoto', 'IFlink', 'IFtext']).forEach((key) => {
    app.component(key, {
      template: COM[key],
    })
  })

  COM.fillPrefix(['IFexterior']).forEach((key) => {
    app.component(key, {
      template: COM[key],
      data() {
        return {
          unmountFn: null,
        }
      },
      computed: {
        isRender() {
          return this.canRender()
        },
        entry() {
          return this.GET('entry')
        }
      },
      watch: {
        isRender(nv, _) {
          if (!nv) {
            this.release()
          } else {
            this.init()
          }
        }
      },
      methods: {
        release() {
          if (typeof this.unmountFn == 'function') {
            this.unmountFn()
            this.unmountFn = null
          }
        },
        async init() {
          let entry = this.entry

          if (!entry) return

          let target = this.IT
          let { externals } = target

          if (typeof externals == 'object') {
            let arr: string[] = Object.keys(externals)

            const first = new Exterior({ name: arr[0], src: externals[arr[0]] })
            const firstRes = await first.load()

            let res: any = await Promise.all(arr.slice(1).map((name, I) => {
              const exterior = new Exterior({ name, src: externals[name] })

              return new Promise(done => {
                GV.sleep(17 * I).then(() => {
                  done(exterior.load())
                })
              })
            }))

            if (!res.concat(firstRes).every(v => v.ready)) {
              console.warn(res)
            }
          }

          let instant = new Exterior({ name: this.hid + this.clone, src: entry, isEntry: true })

          let res: any = await instant.load()

          if (!res.ready) {
            console.warn(res)
          }

          this.unmountFn = res.destory

          res.setup(this.$refs.app)
        }
      },
      mounted() {
        this.init()
      },
      beforeDestroy() {
        this.release()
      },
    })
  })
}

