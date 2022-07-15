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

  return `import { reactive } from 'vue'

export const store = reactive({
  app: {
    currentPage: '${mainPage}',
    lockScroll: false,
  },
  sets: ${str},
  history: {
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
})
`
}

function genStore() {
  let road = getPath('store/tree.ts')
  let subTree = genetateSets('Global')

  genView('Global')

  IF.ctx.pages.forEach(async (pid) => {
    let tree = genetateSets(pid)

    subTree = {
      ...subTree,
      ...tree,
    }
  })

  let content = genStoreContent(subTree)

  writeIn(road, format(content, 'ts'))
}

exports.genStore = genStore
