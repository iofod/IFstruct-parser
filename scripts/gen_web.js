const fs = require('fs')
const path = require('path')
const css = require('css')
const { initTemp, genPageContent, genRouteContent, genStoreContent, genViewContent, genScriptDeps } = require('./temp_web')
const { px2any } = require('./buildStyle')
const { FontList, localizModel, downloadAssets, localizImage, downloadFonts } = require('./downloadAssets')
const { format, writeIn, cleanWriteMap, mergeDiff, getLayout, mkdir, getPath } = require('./helper')

let data
let appid, CTT, Models, Config, pages, HSS, table, Fx, MF, util

let unit = 'rem'
let planform = 'phone'

const getAssetsPath = road => path.resolve(`./public/assets/` + road)

exports.initData = async function initData(payload, cache, selected) {
  data = payload

  appid = data.appid
  CTT = data.CTT
  Models = data.Models
  Config = data.Config

  pages = CTT.T.pages
  HSS = CTT.T.HSS

  table = Models.table
  Fx = Models.Fx
  MF = Models.MF
  util = Models.util

  if (!cache) {
    cleanWriteMap()
  }

  if (selected.includes('pc')) {
    planform = 'pc'
    unit = 'px'
  }
  
  initTemp(data)

  await main()

  return true
}

const IA_LIST = []

function transformSets(hid, sets) {
  let target = {}
  let { status, model, type, layout, ghost, children } = sets

  target.model = {}

  for (let key in model) {
    let { value, subscribe } = model[key]

    target.model[key] = {
      value, use: subscribe
    }
  }

  localizModel(target.model)

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

    px2any(style, unit)
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
      style
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
    target = JSON.parse(JSON.stringify(HSS[hid]))
  } catch (e) {
    console.log(e, hid, HSS[hid])
  }

  tree[hid] = useTransform ? transformSets(hid, target) : target

  if (target && target.children && target.children.length) {
    target.children.forEach(id => {
      genetateSets(id, tree, useTransform)
    })
  }

  return tree
}

function genPages() {
  pages.forEach(pid => {
    let tree = HSS[pid]

    let levels = []
    let levelTag = []
    let levelTagName = []
    let levelImport = []

    tree.children.forEach(hid => {
      let tag = `V${hid}`

      levels.push(hid)
      levelTagName.push(tag)
      levelTag.push(`<!-- ${HSS[hid].name} -->`, `<${tag} hid="${hid}" :clone="''"></${tag}>`)
      levelImport.push(`import ${tag} from '../view/${hid}.vue'`)

      genView(hid)
    })

    let subTree = genetateSets(pid)
    let content = genPageContent(pid, levelTagName, levelTag, levelImport, subTree)

    let road = getPath('pages/' + pid + '.vue')

    writeIn(road, format(content, 'vue'))
  })
}

function genRoutes() {
  let road = getPath('router/index.js')

  let content = genRouteContent(pages.map(pid => {
    let tree = HSS[pid]

    return `{
      path: '/${tree.historyPath || pid}',
      name: '${tree.name}',
      meta: { title: '${tree.name}', pid: '${pid}' },
      component: () => import('../pages/${pid}.vue')
    }`
  }))

  writeIn(road, format(content, 'js'))
}

function genStore() {
  let road = getPath('store/tree.js')

  let subTree = genetateSets('Global')

  genView('Global')

  let content = genStoreContent(appid, subTree)

  writeIn(road, format(content, 'js'))
}

async function genJS(prefix, id, dict, useWindow = false) {
  let { key, value, dir } = dict[id]
  let diff = dict[id]['△']

  value = mergeDiff(value, diff)

  let road

  if (dir) {
    let fdir = 'common/' + prefix + dir + '/'

    road = getPath('common/' + prefix + dir + '/' + key + '.js')

    await mkdir(fdir)
  }
   else {
    road = getPath('common/' + prefix + '/' + key + '.js')
  }

  let content

  if (useWindow) {
    content = `//${key}\n\export default function(data) {\n${value}\n}`
  } else {
    content = `//${key}\n\export default async function(data, next) {\n${value}\n}`
  }
  
  writeIn(road, format(content, 'js'))
}

function genScript() {
  // table, Fx, MF, util 
  Object.keys(Fx).forEach(id => genJS('fx', id, Fx))
  Object.keys(MF).forEach(id => genJS('mf', id, MF))
  Object.keys(util).forEach(id => genJS('util', id, util, true))

  let fxRoad = getPath('common/FX.js')
  let fxContent = genScriptDeps('fx', Object.keys(Fx), Fx, 'FX')

  let mfRoad = getPath('common/MF.js')
  let mfContent = genScriptDeps('mf', Object.keys(MF), MF, 'MF')

  let utRoad = getPath('common/UT.js')
  let utContent = genScriptDeps('util', Object.keys(util), util, 'UT', true)

  writeIn(fxRoad, format(fxContent, 'js'))
  writeIn(mfRoad, format(mfContent, 'js'))
  writeIn(utRoad, format(utContent, 'js'))
}

function genView(lid) {
  let road = getPath('view/' + lid + '.vue')

  let tree = genetateSets(lid, {}, false)
  let gtree = genetateSets('Global', {}, false)

  let content = genViewContent(lid, {
    ...gtree,
    ...tree
  })

  writeIn(road, format(content, 'vue'))
}

function genInjectCSS() {
  let { bgc, gft = 'inherit' } = data.Config.setting

  let IARoad = getPath('style/inject.less')

  let bgContent = `html,body { background-color: ${bgc};}\n.U-unit { font-family: ${gft};}\n`

  let fontContent = Object.keys(FontList).map(name => {
    let url = `/assets/${name}.woff`
    return `@font-face {font-family: '${name}';src:url('${url}')};`
  }).join('\n')
  

  writeIn(IARoad, bgContent + fontContent)
}

async function main() {
  console.time('gen')

  if (data.Config.setting.gft) {
    FontList[data.Config.setting.gft] = true
  }

  genPages()
  genRoutes()
  genStore()
  genScript()
  genInjectCSS()

  await downloadAssets(getAssetsPath)
  await downloadFonts(getAssetsPath, 'woff')

  let $IA_LIST = IA_LIST.map(v => '.' + v)

  let cssBuff = fs.readFileSync(path.resolve(__dirname, './merge.IA.css'))
  let cssVal = cssBuff.toString()
  let cssLines = cssVal.split('\n')
  let cssAst = css.parse(cssVal)

  let injectIAList = []

  cssAst.stylesheet.rules.forEach(obj => {
    if ((obj.type == 'keyframes' && IA_LIST.includes(obj.name)) || (obj.type == 'rule' && $IA_LIST.includes(obj.selectors[0]))) {
      let { start, end } = obj.position
      let str = cssLines.slice(start.line - 1, end.line).join('\n')

      injectIAList.push(str)
    }
  })

  let IARoad = getPath('style/IA.css')

  writeIn(IARoad, injectIAList.join('\n'))
  
  console.timeEnd('gen')
  console.log('Done!')
}
