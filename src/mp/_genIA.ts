import fs from 'fs'
import path from 'path'
import css from 'css'
import { writeIn, getPath } from '../common/helper'
import { IA_LIST } from './_helper'

function genIA() {
  const $IA_LIST = IA_LIST.map((v) => '.' + v)

  const cssBuff = fs.readFileSync(
    path.resolve(__dirname, '../assets/merge.IA.css')
  )
  const cssVal = cssBuff.toString()
  const cssLines = cssVal.split('\n')
  const cssAst = css.parse(cssVal)

  const injectIAList: string[] = []

  cssAst.stylesheet.rules.forEach((obj) => {
    if (
      (obj.type == 'keyframes' && IA_LIST.includes(obj.name)) ||
      (obj.type == 'rule' && $IA_LIST.includes(obj.selectors[0]))
    ) {
      const { start, end } = obj.position
      const str = cssLines.slice(start.line - 1, end.line).join('\n')

      injectIAList.push(str)
    }
  })

  const IARoad = getPath('style/IA.css')

  writeIn(IARoad, injectIAList.join('\n'))
}

export { genIA }
