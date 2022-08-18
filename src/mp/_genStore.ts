import { format, writeIn, getPath } from '../common/helper'
import { IF } from './_env'
import { genetateSets, genView, traveSets } from './_helper'

function genStoreContent(tree) {
  const str = JSON.stringify(
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

  const model = {}
  const TB = IF.ctx.table

  for (const mid in TB) {
    const obj = TB[mid]
    model[obj.key] = {
      id: mid,
      subscriber: obj.subscriber,
    }
  }

  const mstr = JSON.stringify(model, null, 2)
  const config = {}

  IF.ctx.pages.forEach((pid) => {
    const tags = {}
    let hasTag = false

    traveSets(pid, (hid, target) => {
      const tag = target.model.tag

      if (tag) {
        hasTag = true

        const vid = tag.value

        if (vid) tags[vid] = hid
      }
    })

    if (hasTag) config[pid] = tags
  })

  const cfstr = JSON.stringify(config, null, 2)
  const mainPage = IF.ctx.mainPage

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
  const road = getPath('store/tree.ts')
  let subTree = genetateSets('Global')

  genView('Global')

  IF.ctx.pages.forEach(async (pid) => {
    const tree = genetateSets(pid)

    subTree = {
      ...subTree,
      ...tree,
    }
  })

  const content = genStoreContent(subTree)

  writeIn(road, format(content, 'ts'))
}

export { genStore }
