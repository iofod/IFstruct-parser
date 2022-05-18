const { format, writeIn, getPath, mkdir, mergeDiff } = require('../common/helper')
const { IF } = require('./_env')

function genScriptDeps(prefix, ids, dict, namespace, useWindow = false) {
  let injectDeps = ids.map((id) => {
    let { dir, key } = dict[id]

    return `import ${id} from './${prefix}${dir || ''}/${key}' `
  })

  let roadMap = {}

  ids.map((id) => {
    let { dir, key } = dict[id]

    let p = roadMap
    let arr = dir ? dir.split('/').filter((e) => e) : []

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
export default ${JSON.stringify(roadMap, null, 2).replaceAll('"__R__', '').replaceAll('__R__"', '')}
`
}

async function genJS(prefix, id, dict, useWindow = false) {
  let { key, value, dir } = dict[id]
  let diff = dict[id]['△']

  value = mergeDiff(value, diff)

  let road

  if (dir) {
    let fdir = 'common/' + prefix + dir + '/'

    road = getPath('common/' + prefix + dir + '/' + key + '.js')

    await mkdir(fdir)
  } else {
    road = getPath('common/' + prefix + '/' + key + '.js')
  }

  let content

  if (useWindow) {
    content = `//${key}\n\export default function(data) {\n${value}\n}`
  } else {
    content = `//${key}\n\export default async function(data, next) {\n${value}\n}`
  }

  writeIn(road, format(content, 'js'))
}

function genScript() {
  let Fx = IF.ctx.Fx
  let MF = IF.ctx.MF
  let util = IF.ctx.util

  Object.keys(Fx).forEach((id) => genJS('fx', id, Fx))
  Object.keys(MF).forEach((id) => genJS('mf', id, MF))
  Object.keys(util).forEach((id) => genJS('util', id, util, true))

  let fxRoad = getPath('common/FX.js')
  let fxContent = genScriptDeps('fx', Object.keys(Fx), Fx, 'FX')
  let mfRoad = getPath('common/MF.js')
  let mfContent = genScriptDeps('mf', Object.keys(MF), MF, 'MF')
  let utRoad = getPath('common/UT.js')
  let utContent = genScriptDeps('util', Object.keys(util), util, 'UT', true)

  writeIn(fxRoad, format(fxContent, 'js'))
  writeIn(mfRoad, format(mfContent, 'js'))
  writeIn(utRoad, format(utContent, 'js'))
}

exports.genScript = genScript
