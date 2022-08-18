import { format, writeIn, getPath, fixHSS, getLayout } from '../common/helper'
import { IF } from './_env'
import {
  FontList,
  localizModel,
  localizImage,
  localizModules,
  localizExternals,
} from '../common/downloadAssets'
import { genViewContent } from './_temp'
import { px2any } from '../common/buildStyle'

const IA_LIST: string[] = []

function transformSets(_hid, sets) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target: any = {}
  const { status, model, type, layout, ghost, children, content, externals } =
    sets

  target.model = {}

  for (const key in model) {
    const { value, subscribe } = model[key]

    target.model[key] = {
      value,
      use: subscribe,
    }
  }

  if (!IF.useRemote) {
    localizModel(target.model)
  }

  if (content == 'base/exterior') {
    localizModules(target.model)

    if (externals) {
      target.externals = localizExternals(externals)
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

    // Since overflow is invalid for mobile ios, here clipPath is used instead, supported by ios7 and above.
    if (style.overflow == 'hidden' && IF.planform == 'phone') {
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

    const custom = customKeys || {}

    px2any(style, IF.unit)
    localizImage(style)

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

export { genetateSets, genView, traveSets, IA_LIST }
