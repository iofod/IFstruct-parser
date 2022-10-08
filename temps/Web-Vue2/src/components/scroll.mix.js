import FN from '../common/FN'

export default {
  mounted() {
    let el = this.$el

    if (!el) return

    let hash = this.hid + this.clone

    FN.PS.subscribe('vscrollTo:' + hash, (_, v) => {
      let sx = el.style.overflowX == 'auto'
      let sy = el.style.overflowY == 'auto'

      if (!sx && !sy) {
        el.scrollTo({
          left: 0,
          top: v,
          behavior: 'smooth',
        })
      } else {
        el.scrollTo({
          left: sx ? v : 0,
          top: sy ? v : 0,
          behavior: 'smooth',
        })
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
