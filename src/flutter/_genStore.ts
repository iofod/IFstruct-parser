import { format, writeIn } from '../common/helper'
import { getPath, heroCP } from './_helper'
import { localizModel } from '../common/downloadAssets'
import { IF } from './_env'

function traveSets(hid, callback) {
  const target = IF.ctx.HSS[hid]

  callback(hid, target)

  if (target && target.children && target.children.length) {
    target.children.forEach((id) => {
      traveSets(id, callback)
    })
  }
}

function formatObj2DartStr(obj) {
  return JSON.stringify(
    obj,
    function (_k, v) {
      if (typeof v == 'string') {
        return v.replace(/"/g, '\\"')
      }

      return v
    },
    2
  )
    .replace(/\$/g, '\\$')
    .replace(/\\\\/g, '\\') //hack for jsonDecode
}

function genStoreContent() {
  const model = {}
  const TB = IF.ctx.table

  for (const mid in TB) {
    const obj = TB[mid]
    model[obj.key] = {
      id: mid,
      subscriber: obj.subscriber,
    }
  }

  const mstr = formatObj2DartStr(model)
  const config = {}
  const hero = {}
  const tree = {}

  const setStore = (hid) => {
    traveSets(hid, (hid, target) => {
      const obj = {
        ...target,
      }

      delete obj.remarks

      localizModel(obj.model, false)

      tree[hid] = obj
    })
  }

  IF.ctx.pages.forEach((pid) => {
    const tags = {}
    let hasTag = false

    // The tags of each page are independent of each other, i.e.,
    // they can be unique within a page, but not between pages.
    // The best practice is to keep it globally unique.
    traveSets(pid, (hid, target) => {
      const tag = target.model.tag

      if (tag) {
        hasTag = true

        const vid = tag.value

        if (vid) {
          tags[vid] = hid

          hero[hid] = vid
        }
      }
    })

    if (hasTag) {
      config[pid] = tags
    }

    setStore(pid)
  })

  setStore('Global')

  const cfstr = formatObj2DartStr(IF.ctx.Config.setting)
  const hsstr = formatObj2DartStr(tree)
  const heroStr = formatObj2DartStr(hero)
  const heroCPStr = formatObj2DartStr(heroCP)

  return `import 'dart:convert';

var projectTree = jsonDecode('''${hsstr}
''');
var projectModel = jsonDecode('''${mstr}
''');
var projectConfig = jsonDecode('''${cfstr}
''');
var heroTagsMap = jsonDecode('''${heroStr}
''');
var heroCP = jsonDecode('''${heroCPStr}
''');

`
}

function genStore() {
  const road = getPath('store/tree.dart')
  const content = genStoreContent()

  writeIn(road, format(content, 'dart'))
}

export { genStore }
