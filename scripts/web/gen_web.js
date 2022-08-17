const path = require('path')
const { FontList, downloadAssets, downloadFonts, setIFTarget, downloadEntrys, downloadExternals } = require('../common/downloadAssets')
const { cleanWriteMap } = require('../common/helper')
const { IFstruct } = require('../common/IFstruct')
const { IF } = require('./_env')

const getAssetsPath = (road) => path.resolve(`./public/assets/` + road)
const getEntrysPath = (road) => path.resolve(`./src/externals/` + road)
const getExternalsPath = (road) => path.resolve(`./public/lib/` + road)

exports.initData = async function initData(payload, config) {
  let { cache, selected, useRemote } = config
  
  IF.ctx = new IFstruct(payload)
  IF.useRemote = useRemote

  if (!cache) cleanWriteMap()

  if (selected.includes('PC')) {
    IF.planform = 'pc'
    IF.unit = 'px'
  }

  if (selected.includes('Vue3')) {
    IF.framework = 'Vue3'
  }

  setIFTarget(IF.target)

  await main()

  return true
}

const { genPages } = require('./_genPage')
const { genRoutes } = require('./_genRoutes')
const { genStore } = require('./_genStore')
const { genScript } = require('./_genScript')
const { genExternals } = require('./_genExternals')
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
  genExternals()
  genInjectCSS()

  if (!IF.useRemote) {
    await downloadAssets(getAssetsPath)
    await downloadFonts(getAssetsPath, 'woff')
  }

  await downloadEntrys(getEntrysPath)
  await downloadExternals(getExternalsPath)

  genIA()

  console.timeEnd('gen')
  console.log('Done!')
}
