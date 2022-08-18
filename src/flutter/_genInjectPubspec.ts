import fs from 'fs'
import path from 'path'
import { FontList } from '../common/downloadAssets'
import { writeIn } from '../common/helper'

function genInjectPubspec() {
  const list = Object.keys(FontList).filter((name) => name != 'inherit' && name)

  if (!list.length) return

  const road = path.resolve(`./pubspec.yaml`)
  const pubStr = fs.readFileSync(road).toString()
  const beforeMark = '#### fonts inject start ####'
  const afterMark = '#### fonts inject end ####'
  const before = pubStr.split(beforeMark)[0]
  const after = pubStr.split(afterMark)[1]

  writeIn(
    road,
    `${before}${beforeMark}
  fonts: ${list
    .map((name) => {
      return `
    - family: ${name}
      fonts:
        - asset: assets/${name}.ttf`
    })
    .join('\n')}
${afterMark}${after}
`
  )
}

export { genInjectPubspec }
