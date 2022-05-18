const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')
const { genetateSets, genView, traveSets } = require('./_helper')

function genStoreContent(tree) {
  let str = JSON.stringify(
    Object.assign(
      {
        padding: {
          status: [
            {
              name: 'default',
              id: 'default',
              style: [],
              custom: {},
              active: true,
            },
          ],
          model: {},
        },
      },
      tree
    ),
    null,
    2
  )
    .split('\n')
    .join('\n')

  let model = {}
  let TB = IF.ctx.table

  for (let mid in TB) {
    let obj = TB[mid]
    model[obj.key] = {
      id: mid,
      subscriber: obj.subscriber,
    }
  }

  let mstr = JSON.stringify(model, null, 2)
  let config = {}

  IF.ctx.pages.forEach((pid) => {
    let tags = {}
    let hasTag = false

    traveSets(pid, (hid, target) => {
      let tag = target.model.tag

      if (tag) {
        hasTag = true

        let vid = tag.value

        if (vid) tags[vid] = hid
      }
    })

    if (hasTag) config[pid] = tags
  })

  let cfstr = JSON.stringify(config, null, 2)
  let mainPage = IF.ctx.mainPage
  let commonStr = `history: {
    past: [],
    current: {
      target: '${mainPage}',
      during: 500,
      transition: 'fade',
      timestamp: 0
    },
    future: [],
    heroTagsMap: ${cfstr},
    currentTags: {},
    returnTags: {}, 
  },
  models: ${mstr}
  `

  switch (IF.framework) {
    case 'Vue2':
      return `export default {
  state: {
    app: {
      currentPage: '${mainPage}',
    },
    sets: ${str},
    ${commonStr}
  },
}`
    case 'Vue3':
      return `import { reactive } from 'vue'

export const store = reactive({
  app: {
    currentPage: '${mainPage}',
  },
  sets: ${str},
  ${commonStr}
})`      
    default:
      break;
  }
}

function genStore() {
  let useTs = IF.framework == 'Vue3'
  let mark = useTs ? 'ts' : 'js'
  let road = getPath('store/tree.' + mark)
  let subTree = genetateSets('Global')

  genView('Global')

  let content = genStoreContent(subTree)

  writeIn(road, format(content, mark))
}

exports.genStore = genStore
