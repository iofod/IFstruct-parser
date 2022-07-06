const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')
const { FontList, FontCDN } = require('../common/downloadAssets')

function genInjectCSS() {
  let { bgc, gft = 'inherit' } = IF.ctx.Config.setting

  let IARoad = getPath('style/inject.less')
  let bgContent = `.page { background-color: ${bgc}; }\n.U-unit { font-family: ${gft};}\n`

  // If you want to load web fonts dynamically, the file address needs to be the download type.
  // https://developers.weixin.qq.com/miniprogram/dev/api/ui/font/wx.loadFontFace.html
  let fontContent = Object.keys(FontList).filter(name => name != 'inherit')
    .map((name) => {
      let url = `${FontCDN}fonts/${name}.woff`
      return `@font-face {font-family: '${name}';src:url('${url}')};`
    })
    .join('\n')

  writeIn(IARoad, format(bgContent + fontContent))
}

exports.genInjectCSS = genInjectCSS
