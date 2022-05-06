const { FontList } = require('../common/downloadAssets')
const { cleanWriteMap } = require('../common/helper')
const { IFstruct } = require('../common/IFstruct')
const { IF } = require('./_env')

exports.initData = async function initData(payload, config) {
  let { cache } = config

  IF.ctx = new IFstruct(payload)

  if (!cache) cleanWriteMap()

  await main()

  return true
}

const { genPages } = require('./_genPage')
const { genRoutes } = require('./_genRoutes')
const { genStore } = require('./_genStore')
const { genScript } = require('./_genScript')
const { genInjectCSS } = require('./_genInjectCSS')
const { genExpsMap } = require('./_genExpsMap')
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
  genExpsMap()
  genIA()

  console.timeEnd('gen')
  console.log('Done!')
}
