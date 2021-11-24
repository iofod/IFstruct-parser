const fs = require('fs')
const path = require('path')
const { initTemp, genPageContent, genRouteContent, genStoreContent, genEVContent, genScriptContent, genScriptDeps } = require('./temp_flutter')
const { format, writeIn, cleanWriteMap, mergeDiff } = require('./helper')
const { FontList, downloadFonts } = require('./downloadAssets')

let data
let appid, CTT, Models, Config, pages, HSS, table, Fx, MF, util

let getPath
let getAssetsPath

exports.initData = async function initData(payload, cache) {
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

  initTemp(data)

  await main()

  return true
}

const mkdir = road => {
  return new Promise(done => {
    fs.mkdir(getPath(road), { recursive: true }, (err) => {
      if (err) {
        console.log(err)
        done(err)
      }
      done()
    })
  })
}


function transformSets(hid, sets) {
  let { status } = sets

  status.forEach(statu => {
    let { props } = statu
    let { customKeys } = props.option
    let { style } = props

    let custom = customKeys || {}

    if (style.fontFamily) {
      FontList[style.fontFamily] = true
    }
    if (custom.fontFamily) {
      FontList[custom.fontFamily] = true
    }
  })
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
    genetateSets(pid)

    let content = genPageContent(pid)

    let road = getPath('pages/' + pid + '.dart')

    writeIn(road, format(content, 'dart'))
  })
}

function genRoutes() {
  let road = getPath('/router.dart')

  let content = genRouteContent(pages.map(pid => {
    let tree = HSS[pid]

    return {
      dep: `import './pages/${pid}.dart';`,
      ctx: `"${pid}": (context, params) => P${pid}(title: '${tree.name}', pid: '${pid}', path: '${pid}')`
    }
  }))

  writeIn(road, format(content, 'dart'))
}

function genStore() {
  let road = getPath('store/tree.dart')

  let content = genStoreContent()

  writeIn(road, format(content, 'dart'))
}

async function genJS(prefix, id, dict, useWindow = false) {
  let { key, value, dir } = dict[id]
  let diff = dict[id]['△']

  value = mergeDiff(value, diff)

  let road

  if (dir) {
    let fdir = 'common/' + prefix + dir + '/'

    road = getPath('common/' + prefix + dir + '/' + key + '.dart')

    await mkdir(fdir)
  }
   else {
    road = getPath('common/' + prefix + '/' + key + '.dart')
  }

  let content = `import 'package:myapp/common/FN.dart';`

  if (useWindow) {
    content = `final ${id} = '''\n${value}\n''';`
    
  } else {
    content += genScriptContent(key, id, value, false)
  }

  
  writeIn(road, format(content, 'dart'))
}

function genScript() {
  // table, Fx, MF, util 
  Object.keys(Fx).forEach(id => genJS('fx', id, Fx))
  Object.keys(MF).forEach(id => genJS('mf', id, MF))
  Object.keys(util).forEach(id => genJS('util', id, util, true))

  let fxRoad = getPath('common/FX.dart')
  let fxContent = genScriptDeps('fx', Object.keys(Fx), Fx, 'FX')

  let mfRoad = getPath('common/MF.dart')
  let mfContent = genScriptDeps('mf', Object.keys(MF), MF, 'MF')

  let utRoad = getPath('common/UT.dart')
  let utContent = genScriptDeps('util', Object.keys(util), util, 'UT', true)

  writeIn(fxRoad, format(fxContent, 'dart'))
  writeIn(mfRoad, format(mfContent, 'dart'))
  writeIn(utRoad, format(utContent, 'dart'))
}

function genEV() {
  let evContent = genEVContent()

  let evRoad = getPath('components/EV.dart')

  writeIn(evRoad, format(evContent, 'dart'))
}

function setWritePath() {
  getPath = road => path.resolve(`./lib/` + road)
  getAssetsPath = road => path.resolve(`./lib/assets/` + road)
}

function genInjectPubspec() {
  let list = Object.keys(FontList).filter(name => name != 'inherit' && name)

  if (!list.length) return

  let road = path.resolve(`./pubspec.yaml`)

  let pubStr = fs.readFileSync(road).toString()
  let beforeMark = '#### fonts inject start ####'
  let afterMark = '#### fonts inject end ####'
  let before = pubStr.split(beforeMark)[0]
  let after = pubStr.split(afterMark)[1]

  writeIn(road, `${before}${beforeMark}  
  fonts: ${list.map(name => {
      return `
    - family: ${name}
      fonts:
        - asset: lib/assets/${name}.ttf`
    }).join('\n')}
${afterMark}${after}
`)
}

async function main() {
  console.time('gen')

  setWritePath()

  if (data.Config.setting.gft) {
    FontList[data.Config.setting.gft] = true
  }

  genPages()
  genRoutes()
  genScript()
  genEV()
  genStore() //顺序延后

  await downloadFonts(getAssetsPath, 'ttf')

  genInjectPubspec()

  console.timeEnd('gen')
  console.log('Done!')
}