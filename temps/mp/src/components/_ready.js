function ready() {
  let el = this.$el

  if (!el.getAttribute) {
    el = document.querySelector('[hid="' + this.hid + '"]')
  }
  // 这里需要构造 e
  this.$emit('ready', {
    isTrusted: true,
    type: 'ready',
    target: el,
    currentTarget: el,
    srcElement: el,
    path: [el]
  })
}

export default ready