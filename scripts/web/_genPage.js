const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')
const { genView, genetateSets } = require('./_helper')

function genPageContent(pid, levels, levelTag, levelImport, tree) {
	return `
<template>
  <div class="page">
    ${levelTag.join('\n\t\t')}
  </div>
</template>

<script>
import FN from '../common/FN'
${levelImport.join('\n')}

FN.PS.publish('updatePage', { tree: ${JSON.stringify(tree, null, 2)}, pid: "${pid}"})

export default {
  components: {
    ${levels.join(',\n\t\t')}
  }
}
</script>`
}

function genPages() {
  IF.ctx.pages.forEach(pid => {
    let tree = IF.ctx.HSS[pid]

    let levels = []
    let levelTag = []
    let levelTagName = []
    let levelImport = []

    tree.children.forEach(hid => {
      let tag = `V${hid}`

      levels.push(hid)
      levelTagName.push(tag)
      levelTag.push(`<!-- ${IF.ctx.HSS[hid].name} -->`, `<${tag} hid="${hid}" :clone="''"></${tag}>`)
      levelImport.push(`import ${tag} from '../view/${hid}.vue'`)

      genView(hid)
    })

    let subTree = genetateSets(pid)
    let content = genPageContent(pid, levelTagName, levelTag, levelImport, subTree)

    let road = getPath('pages/' + pid + '.vue')

    writeIn(road, format(content, 'vue'))
  })
}

exports.genPages = genPages