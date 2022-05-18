const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')
const { FontList, FontCDN } = require('../common/downloadAssets')

function genInjectCSS() {
  let { bgc, gft = 'inherit' } = IF.ctx.Config.setting

  let IARoad = getPath('style/inject.less')
  let bgContent = `html,body { background-color: ${bgc};}\n.U-unit { font-family: ${gft};}\n`

  let fontContent = Object.keys(FontList)
    .map((name) => {
      let url = IF.useRemote ? `${FontCDN}fonts/${name}.woff2` : `/assets/${name}.woff`
      return `@font-face {font-family: '${name}';src:url('${url}')};`
    })
    .join('\n')

  writeIn(IARoad, format(bgContent + fontContent))
}

exports.genInjectCSS = genInjectCSS
