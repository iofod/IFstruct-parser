const path = require('path')
const { FontList, downloadAssets, downloadFonts } = require('../common/downloadAssets')
const { cleanWriteMap } = require('../common/helper')
const { IFstruct } = require('../common/IFstruct')
const { IF } = require('./_env')

const getAssetsPath = (road) => path.resolve(`./public/assets/` + road)

exports.initData = async function initData(payload, cache, selected, setRemote) {
  IF.ctx = new IFstruct(payload)
  IF.useRemote = setRemote

  if (!cache) cleanWriteMap()

  if (selected.includes('pc')) {
    IF.planform = 'pc'
    IF.unit = 'px'
  }

  await main()

  return true
}

const { genPages } = require('./_genPage')
const { genRoutes } = require('./_genRoutes')
const { genStore } = require('./_genStore')
const { genScript } = require('./_genScript')
const { genInjectCSS } = require('./_genInjectCSS')
const { genIA } = require('./_genIA')

async function main() {
  console.time('gen')

  let { gft } = IF.ctx.Config.setting

  if (gft) FontList[gft] = true

  genPages()
  genRoutes()
  genStore()
  genScript()
  genInjectCSS()

  if (!IF.useRemote) {
    await downloadAssets(getAssetsPath)
    await downloadFonts(getAssetsPath, 'woff')
  }

  genIA()

  console.timeEnd('gen')
  console.log('Done!')
}
