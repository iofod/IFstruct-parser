import { App } from 'vue'

import IFlevel from './IFlevel.vue'
import IFcontainer from './IFcontainer.vue'
import IFtext from './IFtext.vue'
import IFlink from './IFlink.vue'
import IFicon from './IFicon.vue'
import IFiframe from './IFiframe.vue'
import IFhtml from './IFhtml.vue'
import IFmirror from './IFmirror.vue'
import IFphoto from './IFphoto.vue'
import IFinput from './IFinput.vue'
import IFtextarea from './IFtextarea.vue'
import IFvideo from './IFvideo.vue'

export default function registerCOM(app: App<Element>) {
  app.component('IFlevel', IFlevel)
  app.component('IFcontainer', IFcontainer)
  app.component('IFtext', IFtext)
  app.component('IFlink', IFlink)
  app.component('IFicon', IFicon)
  app.component('IFiframe', IFiframe)
  app.component('IFhtml', IFhtml)
  app.component('IFmirror', IFmirror)
  app.component('IFphoto', IFphoto)
  app.component('IFinput', IFinput)
  app.component('IFtextarea', IFtextarea)
  app.component('IFvideo', IFvideo)
}
