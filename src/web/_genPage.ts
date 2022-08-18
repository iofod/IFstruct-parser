import { format, writeIn, getPath } from '../common/helper'
import { IF } from './_env'
import { genView, genetateSets } from './_helper'

function genPageContent(pid, levels, levelTag, levelImport, tree) {
  return `<template>
  <div class="page">
    ${levelTag.join('\n\t\t')}
  </div>
</template>

<script>
import FN from '../common/FN'
${levelImport.join('\n')}

FN.PS.publish('updatePage', { tree: ${JSON.stringify(
    tree,
    null,
    2
  )}, pid: "${pid}"})

export default {
  components: {
    ${levels.join(',\n\t\t')}
  }
}
</script>`
}

function genPages() {
  IF.ctx.pages.forEach((pid) => {
    const tree = IF.ctx.HSS[pid]

    const levels: string[] = []
    const levelTag: string[] = []
    const levelTagName: string[] = []
    const levelImport: string[] = []

    tree.children.forEach((hid) => {
      const tag = `V${hid}`

      levels.push(hid)
      levelTagName.push(tag)
      levelTag.push(
        `<!-- ${IF.ctx.HSS[hid].name} -->`,
        `<${tag} hid="${hid}" :clone="''"></${tag}>`
      )
      levelImport.push(`import ${tag} from '../view/${hid}.vue'`)

      genView(hid)
    })

    const subTree = genetateSets(pid)
    const content = genPageContent(
      pid,
      levelTagName,
      levelTag,
      levelImport,
      subTree
    )

    const road = getPath('pages/' + pid + '.vue')

    writeIn(road, format(content, 'vue'))
  })
}

export { genPages }
