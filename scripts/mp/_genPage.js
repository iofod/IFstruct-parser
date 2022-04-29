const { format, writeIn, getPath, mkdir } = require('../common/helper')
const { IF } = require('./_env')
const { genView, genetateSets } = require('./_helper')

function genPageContent(pid, levels, levelTag, levelImport, tree) {
	return `
<template>
  <view class="page" @touchstart="touchstart" @touchmove="touchmove" @touchend="touchend">
    ${levelTag.join('\n\t\t')}
		<VGlobal hid="Global" :clone="''"></VGlobal>
  </view>
</template>

<script>
import FN from '@common/FN'
import { MouseMixin } from '../../mouse'
${levelImport.join('\n')}
import VGlobal from '../../view/Global.vue'

export default {
	mixins: [MouseMixin],
  components: {
    ${levels.join(',\n\t\t')},
		VGlobal
  },
	created() {
		FN.setContext(this)
	}
}
</script>`
}

function genPages() {
  IF.ctx.pages.forEach(async pid => {
    let target = IF.ctx.HSS[pid]

    let levels = []
    let levelTag = []
    let levelTagName = []
    let levelImport = []

    target.children.forEach(hid => {
      let tag = `V${hid}`

      levels.push(hid)
      levelTagName.push(tag)
      levelTag.push(`<!-- ${IF.ctx.HSS[hid].name} -->`, `<${tag} hid="${hid}" :clone="''"></${tag}>`)
      levelImport.push(`import ${tag} from '../../view/${hid}.vue'`)

      genView(hid)
    })

    await mkdir('pages/' + pid)

    let subTree = genetateSets(pid)
    let content = genPageContent(pid, levelTagName, levelTag, levelImport, subTree)

    let road = getPath('pages/' + pid + '/index.vue')
    let config = getPath('pages/' + pid + '/index.config.js')

    writeIn(road, format(content, 'vue'))
    writeIn(config, format(`export default {
    navigationBarTitleText: '${IF.ctx.HSS[pid].name}'
  }
  `, 'js'))
  })
}

exports.genPages = genPages