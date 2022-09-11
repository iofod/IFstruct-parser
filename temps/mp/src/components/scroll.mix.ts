import FN from '../common/FN'

export default {
  data() {
    return {
      scrollTop: 0,
      scrollLeft: 0
    }
  },
  computed: {
    usx() {
      return this.STYLE.overflowX == 'auto'
    },
    usy() {
      return this.STYLE.overflowY == 'auto'
    },
    useScroll() {
      //非 UseAutoTest 模式，渲染 view 即可
      if (!process.env.UseAutoTest) return false

      return this.usx || this.usy
    }
  },
  mounted() {
    let el = this.$el

    if (!el) return

    let hash = this.hid + this.clone

    FN.PS.subscribe('vscrollTo:' + hash, (_, v) => {
      let sx = this.usx
      let sy = this.usy

      if (!sx && !sy) {
        this.scrollTop = v
      } else {
        if (sx) this.scrollLeft = v
        if (sy) this.scrollTop = v
      }
    })

    this.$emit('ready', {
      isTrusted: true,
      type: 'ready',
      target: el,
      currentTarget: el,
      srcElement: el,
      path: [el],
    })
  },
  beforeDestroy() {
    FN.PS.unsubscribe('vscrollTo:' + this.hid + this.clone)
  }
}
