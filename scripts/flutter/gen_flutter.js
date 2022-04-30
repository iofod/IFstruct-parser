const path = require('path')
const { IFstruct } = require('../common/IFstruct')
const { IF } = require('./_env')
const { cleanWriteMap } = require('../common/helper')
const { FontList, downloadAssets, downloadFonts } = require('../common/downloadAssets')
const { genPages } = require('./_genPage')
const { genRoutes } = require('./_genRoutes')
const { genStore } = require('./_genStore')
const { genScript } = require('./_genScript')
const { genEV } = require('./_genEV')
const { genInjectPubspec } = require('./_genInjectPubspec')
const getAssetsPath = (road) => path.resolve(`./assets/` + road)

exports.initData = async function initData(payload, cache) {
  IF.ctx = new IFstruct(payload)

  if (!cache) cleanWriteMap()

  await main()

  return true
}

async function main() {
  console.time('gen')

  let { gft } = IF.ctx.Config.setting

  if (gft) FontList[gft] = true

  genPages()
  genRoutes()
  genScript()
  genEV()
  genStore()

  await downloadAssets(getAssetsPath)
  await downloadFonts(getAssetsPath, 'ttf')

  genInjectPubspec()

  console.timeEnd('gen')
  console.log('Done!')
}
