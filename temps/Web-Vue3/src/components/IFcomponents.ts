const prefix = `v-if="canRender()" :hid="hid" :clone="clone" :style="STYLE"`
const PRE = 'A'
const IAT = (V) => `<transition
appear
name="custom-classes-transition"
:enter-active-class="hookEnterActive()"
:leave-active-class="hookLeaveActive()"
>${V}</transition>`

const IFcontainer = `<section class="U-container" ${prefix}>
  <slot></slot>
</section>`
const IFlevel = `<div class="wrap" ${prefix}>
<slot></slot>
</div>`
const IFicon = `<div class="U-icon" ${prefix}>
<svg
  xmlns="http://www.w3.org/2000/svg"
  :viewBox="VB"
>
  <path v-for="(p, i) in d" :key="i" :d="p" />
</svg>
</div>`
const IFiframe = `<div class="U-iframe" ${prefix}>
<iframe :src="GET('src')" frameborder="0"></iframe>
</div>`
const IFhtml = `<div class="U-html" ${prefix} v-html="GET('html')"></div>`
const IFcanvas = `<canvas class="U-canvas" ${prefix} :width="GET('width')" :height="GET('height')"></canvas>`
const IFmirror = `<div class="U-mirror" ${prefix}>
<slot></slot>
</div>`
const IFphoto = `<img class="U-photo" ${prefix} :src="GET('url')" :alt="GET('alt')" />`
const IFtext = `<p class="U-text" ${prefix}>{{ GET('msg') }}</p>`
const IFlink = `<a class="U-link" :href="GET('link')" target="_blank" ${prefix}>{{ GET('msg') }}</a>`
const IFinput = `<input
class="U-input"
${prefix}
:type="GET('type') || 'text'"
:placeholder="GET('placeholder')"
:disabled="!!GET('disabled')"
:maxlength="GET('maxlength')"
:value="GET('value')"
:autofocus="!!GET('autofocus')"
:autocomplete="!!GET('autocomplete')"
@input="input"
@change="change"
/>`
const IFtextarea = `<textarea
class="U-textarea"
${prefix}
:placeholder="GET('placeholder')"
:disabled="!!GET('disabled')"
:maxlength="GET('maxlength')"
:value="GET('value')"
:autofocus="!!GET('autofocus')"
:autocomplete="!!GET('autocomplete')"
@input="input"
@change="change"
></textarea>`
const IFvideo = `<video class="U-video" ${prefix} :src="GET('url')" :controls="GET('controls')" :autoplay="GET('autoplay')" :loop="GET('loop')" :muted="GET('muted')" ref="video" @play="handle" @pause="handle" @ended="handle" @waiting="handle" @error="handle"></video>`
const IFexterior = `<section class="U-exterior" v-if="isRender" :hid="hid" :clone="clone" :style="STYLE"><div class="U-exterior-wrap" :hid="hid" :clone="clone" ref="app"></div></section>`

function ready() {
  let el = this.$el

  if (!el.getAttribute) {
    el = document.querySelector('[hid="' + this.hid + '"]')
  }

  this.$emit('ready', {
    isTrusted: true,
    type: 'ready',
    target: el,
    currentTarget: el,
    srcElement: el,
    path: [el],
  })
}

// IFcontainer => AIFcontainer
function wrapTransition(origin) {
  let wrap = {}
  for (let key in origin) {
    wrap[PRE + key] = IAT(origin[key])
  }
  return wrap
}

function fillPrefix(arr) {
  return [...arr, ...arr.map((k) => PRE + k)]
}

const originTemplate = {
  IFcontainer,
  IFlevel,
  IFicon,
  IFiframe,
  IFhtml,
  IFmirror,
  IFcanvas,
  IFphoto,
  IFtext,
  IFlink,
  IFinput,
  IFtextarea,
  IFvideo,
  IFexterior
}

export default {
  ready,
  fillPrefix,
  ...originTemplate,
  ...wrapTransition(originTemplate),
}
