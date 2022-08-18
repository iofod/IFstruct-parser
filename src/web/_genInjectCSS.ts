import { format, writeIn, getPath } from '../common/helper'
import { IF } from './_env'
import { FontList, FontCDN } from '../common/downloadAssets'

function genInjectCSS() {
  const { bgc, gft = 'inherit' } = IF.ctx.Config.setting

  const IARoad = getPath('style/inject.less')
  const bgContent = `html,body { background-color: ${bgc};}\n.U-unit { font-family: ${gft};}\n`

  const fontContent = Object.keys(FontList)
    .filter((name) => name != 'inherit')
    .map((name) => {
      const url = IF.useRemote
        ? `${FontCDN}fonts/${name}.woff2`
        : `/assets/${name}.woff`
      return `@font-face {font-family: '${name}';src:url('${url}')};`
    })
    .join('\n')

  writeIn(IARoad, format(bgContent + fontContent))
}

export { genInjectCSS }
