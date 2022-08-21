import { format, writeIn, getPath } from '../common/helper'
import { IF } from './_env'
import { entryList, innerEntryList, externalList } from '../common/downloadAssets'

function genExternals() {
  const useTs = IF.framework == 'Vue3'
  const mark = useTs ? 'ts' : 'js'

  const road = getPath('externals/index.' + mark)
  const gvStr = useTs ? `import GV from '../lib/GV'\n` : ''

  const content = `${gvStr}
import UT from '../common/UT'
export const Dependents = {
  ${externalList
    .map((o) => {
      const { filename, dir } = o

      return `'${filename}': () => GV.inject('./lib/${dir}/${filename}', '${
        filename.endsWith('.css') ? 'link' : 'script'
      }')`
    })
    .join(',\n\t')}
}

export const Entrys = {
  ${entryList
    .map((o) => {
      const { filename, dir } = o

      return `'${filename}': () => import('./${dir}/${filename}')`
    })
    .join(',\n\t')},
  ${innerEntryList.map((s) => {
    return `'${s}': ${s.substring(1).split('/').join('.')}`
  }).join(',\n\t')}
}
  `

  writeIn(road, format(content, mark))
}

export { genExternals }
