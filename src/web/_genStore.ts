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
  const commonStr = `history: {
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
    useRunCases: false,
    previewEventMap: {},
    interactionRecord: {},
    previewCursor: {
      x: -20,
      y: -20,
      useTransition: true
    },
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
      break
  }

  return ''
}

function genStore() {
  const useTs = IF.framework == 'Vue3'
  const mark = useTs ? 'ts' : 'js'
  const road = getPath('store/tree.' + mark)
  const subTree = genetateSets('Global')

  genView('Global')

  const content = genStoreContent(subTree)

  writeIn(road, format(content, mark))
}

export { genStore }
