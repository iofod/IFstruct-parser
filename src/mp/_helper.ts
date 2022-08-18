import { format, writeIn, getPath, fixHSS, getLayout } from '../common/helper'
import { IF } from './_env'
import { FontList } from '../common/downloadAssets'
import { px2any } from '../common/buildStyle'
import { genViewContent } from './_temp'

const IA_LIST: string[] = []
const LOCAL_ATTR_LIST = [
  'backdropFilter',
  'filter',
  'maskSize',
  'maskImage',
  'maskRepeat',
]
const LOCAL_CSS_RULE = {}

function hump2Line(name) {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function transformSets(hid, sets) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target: any = {}
  const { status, model, type, layout, children, ghost, content } = sets

  target.model = {}
  target.content = content

  for (const key in model) {
    const { value, subscribe } = model[key]

    target.model[key] = {
      value,
      use: subscribe,
    }
  }

  if (type == 'level') {
    target.layout = getLayout(layout)
  }

  target.children = children

  target.status = status.map((statu) => {
    const { name, id, active, props } = statu
    const { customKeys, V, IAA, IAD } = props.option
    const { x, y, tx, ty, d, s, style } = props

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

    const custom = customKeys || {}
    const localID = hid + '-' + id

    const css = {
      ...style,
      ...custom,
    }

    px2any(css, IF.unit)

    LOCAL_ATTR_LIST.forEach((key) => {
      if (typeof css[key] == 'string') {
        if (!LOCAL_CSS_RULE[localID]) LOCAL_CSS_RULE[localID] = {}

        const value = IF.ctx.parseModelExp(css[key], hid)

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
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
  const road = getPath('view/' + lid + '.vue')

  const tree = genetateSets(lid, {}, false)
  const gtree = genetateSets('Global', {}, false)

  const content = genViewContent(lid, {
    ...gtree,
    ...tree,
  })

  writeIn(road, format(content, 'vue'))
}

function traveSets(hid, callback) {
  const target = IF.ctx.HSS[hid]

  callback(hid, target)

  if (target && target.children && target.children.length) {
    target.children.forEach((id) => {
      traveSets(id, callback)
    })
  }
}

export { IA_LIST, genetateSets, traveSets, genView, LOCAL_CSS_RULE }
