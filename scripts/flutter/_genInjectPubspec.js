const fs = require('fs')
const path = require('path')
const { FontList } = require('../common/downloadAssets')
const { writeIn } = require('../common/helper')

function genInjectPubspec() {
  let list = Object.keys(FontList).filter(name => name != 'inherit' && name)

  if (!list.length) return

  let road = path.resolve(`./pubspec.yaml`)
  let pubStr = fs.readFileSync(road).toString()
  let beforeMark = '#### fonts inject start ####'
  let afterMark = '#### fonts inject end ####'
  let before = pubStr.split(beforeMark)[0]
  let after = pubStr.split(afterMark)[1]

  writeIn(road, `${before}${beforeMark}  
  fonts: ${list.map(name => {
      return `
    - family: ${name}
      fonts:
        - asset: assets/${name}.ttf`
    }).join('\n')}
${afterMark}${after}
`)
}

exports.genInjectPubspec = genInjectPubspec