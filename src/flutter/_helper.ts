import path from 'path'
import { fixHSS, parseExclude, processReplacement } from '../common/helper'
import { FontList, localizImage } from '../common/downloadAssets'
import { IF } from './_env'

const getPath = (road) => path.resolve(`./lib/` + road)

function transformSets(_hid: string, sets) {
  const { status } = sets

  status.forEach((statu) => {
    const { props } = statu
    const { customKeys } = props.option
    const { style } = props

    const custom = customKeys || {}

    localizImage(style, false)

    if (style.fontFamily) {
      FontList[style.fontFamily] = true
    }
    if (custom.fontFamily) {
      FontList[custom.fontFamily] = true
    }
  })

  return sets
}

function genetateSets(hid, tree = {}, useTransform = true) {
  let target
  try {
    target = fixHSS(IF.ctx.HSS[hid])
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

function genExp(exp, prefix = 'FN.parseModelStr', suffix = '') {
  const expList = exp.match(/\$\w+(-\w+)?(<.+?>)?/g) || []

  exp = exp.split("'").join('`')

  expList.forEach((mds) => {
    // The $response in the expression uses the variable directly.
    if (mds == '$response') {
      exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${mds.substring(1)}`)
    } else {
      exp = exp.replace(
        new RegExp('\\' + mds, 'gm'),
        `${prefix}('\\${mds}', e.hid, true)${suffix}`
      )
    }
  })

  return exp
}

function genEvalStr(exp) {
  return `evalJS('${exp}')`
}

const expStringify = (params, hid, jumpKeys: string[] = []) => {
  for (const attr in params) {
    const value = params[attr]

    const mark = ''

    if (
      !jumpKeys.includes(attr) &&
      typeof value == 'string' &&
      value != '$current' &&
      value.slice(0, 1) === '$' &&
      parseExclude.filter((v) => value.includes(v)).length < 1
    ) {
      params[attr] = `__R__parseModelStr('${mark}${value}', e.hid)__R__`
    }
  }
  return processReplacement(JSON.stringify(params, null, 2), hid)
}

const heroCP = {}

export { getPath, genetateSets, genExp, expStringify, heroCP, genEvalStr }
