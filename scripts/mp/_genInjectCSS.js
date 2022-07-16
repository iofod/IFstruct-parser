const { format, writeIn, getPath } = require('../common/helper')
const { LOCAL_CSS_RULE } = require('./_helper')
const { IF } = require('./_env')
const { FontList, FontCDN } = require('../common/downloadAssets')

function genInjectCSS() {
  let { bgc, gft = 'inherit' } = IF.ctx.Config.setting

  let IARoad = getPath('style/inject.less')
  let bgContent = `.page { background-color: ${bgc}; }\n.U-unit { font-family: ${gft};}\n\n`

  // If you want to load web fonts dynamically, the file address needs to be the download type.
  // https://developers.weixin.qq.com/miniprogram/dev/api/ui/font/wx.loadFontFace.html
  let fontContent = Object.keys(FontList).filter(name => name != 'inherit')
    .map((name) => {
      let url = `${FontCDN}fonts/${name}.woff`
      return `@font-face {font-family: '${name}';src:url('${url}')};`
    })
    .join('\n\n')

  let hidCssContent = Object.keys(LOCAL_CSS_RULE).map(rid => {
    let obj = LOCAL_CSS_RULE[rid]
    let list = []

    for (let key in obj) {
      list.push(`\t${key}: ${obj[key]};`)
    }

    return `.${rid} {
${list.join('\n')}  
}`
  }).join('\n\n')

  writeIn(IARoad, format(bgContent + fontContent + hidCssContent))
}

exports.genInjectCSS = genInjectCSS
