const { format, writeIn } = require('../common/helper')
const { getPath, heroCP } = require('./_helper')
const { localizModel } = require('../common/downloadAssets')
const { IF } = require('./_env')

function traveSets(hid, callback) {
  let target = IF.ctx.HSS[hid]

  callback(hid, target)

  if (target && target.children && target.children.length) {
    target.children.forEach((id) => {
      traveSets(id, callback)
    })
  }
}

function formatObj2DartStr(obj) {
  return JSON.stringify(obj, function(k, v) {
    if (typeof v == 'string') {
      return v.replace(/"/g, '\\"')
    }

    return v
  }, 2).replace(/\$/g, '\\$').replace(/\\\\/g, '\\') //hack for jsonDecode
}

function genStoreContent() {
  let model = {}
  let TB = IF.ctx.table

  for (let mid in TB) {
    let obj = TB[mid]
    model[obj.key] = {
      id: mid,
      subscriber: obj.subscriber,
    }
  }

  let mstr = formatObj2DartStr(model)
  let config = {}
  let hero = {}
  let tree = {}

  const setStore = (hid) => {
    traveSets(hid, (hid, target) => {
      let obj = {
        ...target,
      }

      delete obj.remarks

      localizModel(obj.model, false)

      tree[hid] = obj
    })
  }

  IF.ctx.pages.forEach((pid) => {
    let tags = {}
    let hasTag = false

    // The tags of each page are independent of each other, i.e.,
    // they can be unique within a page, but not between pages.
    // The best practice is to keep it globally unique.
    traveSets(pid, (hid, target) => {
      let tag = target.model.tag

      if (tag) {
        hasTag = true

        let vid = tag.value

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

  let cfstr = formatObj2DartStr(IF.ctx.Config.setting)
  let hsstr = formatObj2DartStr(tree)
  let heroStr = formatObj2DartStr(hero)
  let heroCPStr = formatObj2DartStr(heroCP)

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
  let road = getPath('store/tree.dart')
  let content = genStoreContent()

  writeIn(road, format(content, 'dart'))
}

exports.genStore = genStore
