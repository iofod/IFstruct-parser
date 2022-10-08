import { format, writeIn, getPath, mkdir } from '../common/helper'
import { IF } from './_env'
import { genView } from './_helper'

function genPageContent(pid, levels, levelTag, levelImport) {
  return `
<template>
  <view class="page" pid="${pid}" @touchstart="touchstart" @touchmove="touchmove" @touchend="touchend" @touchcancel="touchcancel">
    ${levelTag.join('\n\t\t')}
		<VGlobal hid="Global" :clone="''"></VGlobal>
    <PreviewCursor key="${pid}"></PreviewCursor>
  </view>
</template>

<script>
import FN from '@common/FN'
import { MouseMixin } from '../../mouse'
${levelImport.join('\n')}
import VGlobal from '../../view/Global.vue'
import PreviewCursor from '../../components/cursor.vue'

export default {
	mixins: [MouseMixin],
  components: {
    ${levels.join(',\n\t\t')},
		VGlobal,
    PreviewCursor
  },
	created() {
		FN.setContext(this)
	}
}
</script>`
}

function genPages() {
  IF.ctx.pages.forEach(async (pid) => {
    const target = IF.ctx.HSS[pid]

    const levels: string[] = []
    const levelTag: string[] = []
    const levelTagName: string[] = []
    const levelImport: string[] = []

    target.children.forEach((hid) => {
      const tag = `V${hid}`

      levels.push(hid)
      levelTagName.push(tag)
      levelTag.push(
        `<!-- ${IF.ctx.HSS[hid].name} -->`,
        `<${tag} hid="${hid}" :clone="''"></${tag}>`
      )
      levelImport.push(`import ${tag} from '../../view/${hid}.vue'`)

      genView(hid)
    })

    await mkdir('pages/' + pid)

    const content = genPageContent(pid, levelTagName, levelTag, levelImport)

    const road = getPath('pages/' + pid + '/index.vue')
    const config = getPath('pages/' + pid + '/index.config.js')

    writeIn(road, format(content, 'vue'))
    writeIn(
      config,
      format(
        `export default {
    navigationBarTitleText: '${IF.ctx.HSS[pid].name}'
  }
  `,
        'js'
      )
    )
  })
}

export { genPages }
