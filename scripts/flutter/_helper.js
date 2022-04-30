const path = require('path')
const { fixHSS, parseExclude } = require('../common/helper')
const { FontList, localizImage } = require('../common/downloadAssets')
const { IF } = require('./_env')

const getPath = (road) => path.resolve(`./lib/` + road)

function transformSets(hid, sets) {
  let { status } = sets

  status.forEach((statu) => {
    let { props } = statu
    let { customKeys } = props.option
    let { style } = props

    let custom = customKeys || {}

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

  tree[hid] = useTransform ? transformSets(hid, target) : target

  if (target && target.children && target.children.length) {
    target.children.forEach((id) => {
      genetateSets(id, tree, useTransform)
    })
  }

  return tree
}

function genExp(exp, prefix = 'FN.parseModelStr', suffix = '') {
  let expList = exp.match(/\$\w+(-\w+)?(<.+?>)?/g) || []

  expList.forEach((mds) => {
    // The $response in the expression uses the variable directly.
    if (mds == '$response') {
      exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${mds.substr(1)}`)
    } else {
      exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${prefix}('\\${mds}', e.hid)${suffix}`)
    }
  })

  return exp
}

const expStringify = (params, hid, jumpKeys = []) => {
  for (let attr in params) {
    let value = params[attr]

    if (
      !jumpKeys.includes(attr) &&
      typeof value == 'string' &&
      value != '$current' &&
      value.slice(0, 1) === '$' &&
      parseExclude.filter((v) => value.includes(v)).length < 1
    ) {
      params[attr] = `__R__parseModelStr('${value}', e.hid)__R__`
    }
  }
  return JSON.stringify(params, null, 2)
    .replace(/\$current/g, hid)
    .split('\n')
    .join('\n\t\t\t')
    .replace('"__R__', '')
    .replace('__R__"', '')
}

const heroCP = {}

exports.getPath = getPath
exports.genetateSets = genetateSets
exports.genExp = genExp
exports.expStringify = expStringify
exports.heroCP = heroCP
