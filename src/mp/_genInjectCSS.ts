import { format, writeIn, getPath } from '../common/helper'
import { LOCAL_CSS_RULE } from './_helper'
import { IF } from './_env'
import { FontList, FontCDN } from '../common/downloadAssets'

function genInjectCSS() {
  const { bgc, gft = 'inherit' } = IF.ctx.Config.setting

  const IARoad = getPath('style/inject.less')
  const bgContent = `.page { background-color: ${bgc}; }\n.U-unit { font-family: ${gft};}\n\n`

  // If you want to load web fonts dynamically, the file address needs to be the download type.
  // https://developers.weixin.qq.com/miniprogram/dev/api/ui/font/wx.loadFontFace.html
  const fontContent = Object.keys(FontList)
    .filter((name) => name != 'inherit')
    .map((name) => {
      const url = `${FontCDN}fonts/${name}.woff`
      return `@font-face {font-family: '${name}';src:url('${url}')};`
    })
    .join('\n\n')

  const hidCssContent = Object.keys(LOCAL_CSS_RULE)
    .map((rid) => {
      const obj = LOCAL_CSS_RULE[rid]
      const list: string[] = []

      for (const key in obj) {
        list.push(`\t${key}: ${obj[key]};`)
      }

      return `.${rid} {
${list.join('\n')}
}`
    })
    .join('\n\n')

  writeIn(IARoad, format(bgContent + fontContent + hidCssContent))
}

export { genInjectCSS }
