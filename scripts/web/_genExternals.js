const { format, writeIn, getPath, mkdir } = require('../common/helper')
const { IF } = require('./_env')
const { entryList, externalList } = require('../common/downloadAssets')

function genExternals() {
  let useTs = IF.framework == 'Vue3'
  let mark = useTs ? 'ts' : 'js'

  let road = getPath('externals/index.' + mark)

  let content = `import GV from '../lib/GV'
export const Dependents = {
  ${externalList
    .map((o) => {
      let { filename, dir } = o

      return `'${filename}': () => GV.inject('./lib/${dir}/${filename}', '${
        filename.endsWith('.css') ? 'link' : 'script'
      }')`
    })
    .join(',\n\t')}
}

export const Entrys = {
  ${entryList
    .map((o) => {
      let { filename, dir } = o

      return `'${filename}': () => import('./${dir}/${filename}')`
    })
    .join(',\n\t')}
}
  `

  writeIn(road, format(content, mark))
}

exports.genExternals = genExternals
