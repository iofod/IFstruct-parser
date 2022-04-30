const { format, writeIn, getPath, fixHSS, getLayout } = require('../common/helper')
const { IF } = require('./_env')
const { FontList, localizModel, localizImage } = require('../common/downloadAssets')
const { genViewContent } = require('./_temp')
const { px2any } = require('../common/buildStyle')

const IA_LIST = []

function transformSets(hid, sets) {
  let target = {}
  let { status, model, type, layout, ghost, children } = sets

  target.model = {}

  for (let key in model) {
    let { value, subscribe } = model[key]

    target.model[key] = {
      value,
      use: subscribe,
    }
  }

  if (!IF.useRemote) {
    localizModel(target.model)
  }

  if (type == 'level') {
    target.layout = getLayout(layout)
  }

  target.children = children

  target.status = status.map((statu, I) => {
    let { name, id, active, props } = statu
    let { customKeys, V, IAA, IAD } = props.option
    let { x, y, d, s, style } = props

    style.x = x
    style.y = y
    style.d = d
    style.s = s

    // Since overflow is invalid for mobile ios, here clipPath is used instead, supported by ios7 and above.
    if (style.overflow == 'hidden' && planform == 'phone') {
      style.clipPath = 'inset(0px)'
    }

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

    px2any(style, IF.unit)
    localizImage(style)

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

exports.genetateSets = genetateSets
exports.genView = genView
exports.traveSets = traveSets
exports.IA_LIST = IA_LIST
