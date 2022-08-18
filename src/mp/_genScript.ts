/* eslint-disable prefer-const */
import { format, writeIn, getPath, mkdir, mergeDiff } from '../common/helper'
import { IF } from './_env'

function genScriptDeps(prefix, ids, dict, namespace, useWindow = false) {
  const injectDeps = ids.map((id) => {
    const { dir, key } = dict[id]

    return `import ${id} from './${prefix}${dir || ''}/${key}' `
  })

  const roadMap = {}

  ids.map((id) => {
    const { dir, key } = dict[id]

    let p = roadMap
    const arr = dir ? dir.split('/').filter((e) => e) : []

    arr.forEach((d) => {
      p[d] = p[d] || {}
      p = p[d]
    })

    p[key] = `__R__${namespace}.${id}__R__`
  })

  let body = `

	`

  if (useWindow) {
    body += `
const ${namespace} = {
	${ids.join(',\n')}
}
`
  } else {
    body += `
import FA from './FA'

const ${namespace} = {
	...FA.promisify({
		${ids.join(',\n')}
	})
}
`
  }

  return `
${injectDeps.join('\n')}
${body}
export default ${JSON.stringify(roadMap, null, 2)
    .replaceAll('"__R__', '')
    .replaceAll('__R__"', '')}
`
}

async function genJS(prefix, id, dict, useWindow = false) {
  let { key, value, dir } = dict[id]
  const diff = dict[id]['△']

  value = mergeDiff(value, diff)

  let road

  if (dir) {
    const fdir = 'common/' + prefix + dir + '/'

    road = getPath('common/' + prefix + dir + '/' + key + '.js')

    await mkdir(fdir)
  } else {
    road = getPath('common/' + prefix + '/' + key + '.js')
  }

  let content
  const preDepend = `import SDK from '@common/SDK'\nimport FN from '@common/FN'\nimport UT from '@common/UT'\nconst window = { SDK, FN, UT }`

  if (useWindow) {
    content = `${preDepend}\n//${key}\nexport default function(data) {\n${value}\n}`
  } else {
    content = `${preDepend}\n//${key}\nexport default async function(data, next) {\n${value}\n}`
  }

  writeIn(road, format(content, 'js'))
}

function genScript() {
  const Fx = IF.ctx.Fx
  const MF = IF.ctx.MF
  const util = IF.ctx.util

  Object.keys(Fx).forEach((id) => genJS('fx', id, Fx))
  Object.keys(MF).forEach((id) => genJS('mf', id, MF))
  Object.keys(util).forEach((id) => genJS('util', id, util, true))

  const fxRoad = getPath('common/FX.js')
  const fxContent = genScriptDeps('fx', Object.keys(Fx), Fx, 'FX')
  const mfRoad = getPath('common/MF.js')
  const mfContent = genScriptDeps('mf', Object.keys(MF), MF, 'MF')
  const utRoad = getPath('common/UT.js')
  const utContent = genScriptDeps('util', Object.keys(util), util, 'UT', true)

  writeIn(fxRoad, format(fxContent, 'js'))
  writeIn(mfRoad, format(mfContent, 'js'))
  writeIn(utRoad, format(utContent, 'js'))
}

export { genScript }
