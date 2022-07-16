const { format, writeIn, getPath, fixHSS, getLayout } = require('../common/helper')
const { IF } = require('./_env')
const { FontList, localizModel, localizImage } = require('../common/downloadAssets')
const { px2any } = require('../common/buildStyle')
const { genViewContent } = require('./_temp')

const IA_LIST = []
const LOCAL_ATTR_LIST = ['backdropFilter', 'filter', 'maskSize', 'maskImage', 'maskRepeat']
const LOCAL_CSS_RULE = {}

function hump2Line(name) {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function transformSets(hid, sets) {
  let target = {}
  let { status, model, type, layout, children, ghost } = sets

  target.model = {}

  for (let key in model) {
    let { value, subscribe } = model[key]

    target.model[key] = {
      value,
      use: subscribe,
    }
  }

  if (type == 'level') {
    target.layout = getLayout(layout)
  }

  target.children = children

  target.status = status.map((statu, I) => {
    let { name, id, active, props } = statu
    let { customKeys, V, IAA, IAD } = props.option
    let { x, y, tx, ty, d, s, style } = props

    style.x = x
    style.y = y
    style.tx = tx
    style.ty = ty
    style.d = d
    style.s = s

    if (ghost) {
      style.pointerEvents = 'none'
    } else {
      delete style.pointerEvents
    }

    if (V === false) {
      style.visibility = 'hidden'
    } else {
      delete style.visibility
    }

    let custom = customKeys || {}
    let localID = hid + '-' + id

    let css = {
      ...style,
      ...custom,
    }

    px2any(css, IF.unit)

    LOCAL_ATTR_LIST.forEach(key => {
      if (typeof css[key] == 'string') {
        if (!LOCAL_CSS_RULE[localID]) LOCAL_CSS_RULE[localID] = {}

        let value = IF.ctx.parseModelExp(css[key], hid)

        LOCAL_CSS_RULE[localID][hump2Line(key)] = value

        delete style[key]
        delete custom[key]
      }
    })

    px2any(style, IF.unit)

    if (style.fontFamily) {
      FontList[style.fontFamily] = true
    }
    if (custom.fontFamily) {
      FontList[custom.fontFamily] = true
    }

    let config = {
      name,
      id: id || 'default',
      active,
      custom,
      style,
    }

    if (IAA) {
      config.IAA = IAA

      IA_LIST.push(IAA.split(' ')[0])
    }

    if (IAD) {
      config.IAD = IAD

      IA_LIST.push(IAD.split(' ')[0])
    }

    return config
  })

  return target
}

function genetateSets(hid, tree = {}, useTransform = true) {
  let target
  try {
    target = JSON.parse(JSON.stringify(fixHSS(IF.ctx.HSS[hid])))
  } catch (e) {
    console.log(e, hid, IF.ctx.HSS[hid])
  }

  if (target.type == 'level' && target.ghost) {
    target.status[0].props.style = {}
  }

  tree[hid] = useTransform ? transformSets(hid, target) : target

  if (target && target.children && target.children.length) {
    target.children.forEach((id) => {
      genetateSets(id, tree, useTransform)
    })
  }

  return tree
}

function genView(lid) {
  let road = getPath('view/' + lid + '.vue')

  let tree = genetateSets(lid, {}, false)
  let gtree = genetateSets('Global', {}, false)

  let content = genViewContent(lid, {
    ...gtree,
    ...tree,
  })

  writeIn(road, format(content, 'vue'))
}

function traveSets(hid, callback) {
  let target = IF.ctx.HSS[hid]

  callback(hid, target)

  if (target && target.children && target.children.length) {
    target.children.forEach((id) => {
      traveSets(id, callback)
    })
  }
}

exports.IA_LIST = IA_LIST
exports.genetateSets = genetateSets
exports.traveSets = traveSets
exports.genView = genView
exports.LOCAL_CSS_RULE = LOCAL_CSS_RULE
