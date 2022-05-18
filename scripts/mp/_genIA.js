const fs = require('fs')
const path = require('path')
const css = require('css')
const { format, writeIn, getPath } = require('../common/helper')
const { IA_LIST } = require('./_helper')

function genIA() {
  let $IA_LIST = IA_LIST.map((v) => '.' + v)

  let cssBuff = fs.readFileSync(path.resolve(__dirname, '../assets/merge.IA.css'))
  let cssVal = cssBuff.toString()
  let cssLines = cssVal.split('\n')
  let cssAst = css.parse(cssVal)

  let injectIAList = []

  cssAst.stylesheet.rules.forEach((obj) => {
    if (
      (obj.type == 'keyframes' && IA_LIST.includes(obj.name)) ||
      (obj.type == 'rule' && $IA_LIST.includes(obj.selectors[0]))
    ) {
      let { start, end } = obj.position
      let str = cssLines.slice(start.line - 1, end.line).join('\n')

      injectIAList.push(str)
    }
  })

  let IARoad = getPath('style/IA.css')

  writeIn(IARoad, injectIAList.join('\n'))
}

exports.genIA = genIA
