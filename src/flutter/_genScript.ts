/* eslint-disable prefer-const */
import { format, writeIn, mkdir, mergeDiff } from '../common/helper'
import { getPath } from './_helper'
import { IF } from './_env'

function genScriptDeps(prefix, ids, dict, namespace, useWindow = false) {
  const injectDeps = ids.map((id) => {
    const { dir, key } = dict[id]

    return `import './${prefix}${dir || ''}/${key}.dart';`
  })

  const roadMap = {}
  const jsRoadMap = {}

  ids.map((id) => {
    const { dir, key } = dict[id]

    let p = roadMap
    let q = jsRoadMap
    const arr = dir ? dir.split('/').filter((e) => e) : []

    // Generate Catalog
    arr.forEach((d) => {
      p[d] = p[d] || {}
      q[d] = q[d] || {}
      p = p[d]
      q = q[d]
    })

    p[key] = `__R___${namespace}['${id}']__R__`
    q[key] = `__R__${namespace}.${id}__R__`
  })

  let body = `
// ignore_for_file: unused_element
import './FA.dart';
	`
  const idMap = ids.map((id) => `"${id}": ${id}`).join(',\n')

  if (useWindow) {
    body = `
const UT = {
	${ids.map((id) => `${id}(data) {\n$${id}\n}`).join(',\n')}
}
		`
    return `
import './FN.dart';
${injectDeps.join('\n')}
initUT() {
	evalJS('''
	${body}
	window.UT = ${JSON.stringify(jsRoadMap, null, 2)
    .replaceAll('"__R__', '')
    .replaceAll('__R__"', '')}
	''');
}
		`
  } else {
    body += `
final _${namespace} = FA.promisify({
	${idMap}
});
`
    return `
	${injectDeps.join('\n')}
	${body}
	final ${namespace} = ${JSON.stringify(roadMap, null, 2)
      .replaceAll('"__R__', '')
      .replaceAll('__R__"', '')};
	`
  }
}

function genScriptContent(_key, id, value) {
  //Replace the function body with the convention mode.
  const str = value
    .replace(/next\(\)/g, 'callBridge("$token")')
    .replace(/next\(/g, 'callBridge("$token", ')

  return `
Future ${id}(data, next) async {
	String token = GV.uuid();

  PS.subscribeOnce('JS:$token', next);

	evalJS('''
  (async(data) => {
	${str}
	})(\${data.toString()})
	''');
}
`
}

async function genJS(prefix, id, dict, useWindow = false) {
  let { key, value, dir } = dict[id]
  const diff = dict[id]['△']

  value = mergeDiff(value, diff).replaceAll('$', '\\$')

  let road

  if (dir) {
    const fdir = 'common/' + prefix + dir + '/'

    road = getPath('common/' + prefix + dir + '/' + key + '.dart')

    await mkdir(fdir)
  } else {
    road = getPath('common/' + prefix + '/' + key + '.dart')
  }

  let content = `import 'package:myapp/common/FN.dart';`

  if (useWindow) {
    content = `const ${id} = '''\n${value}\n''';`
  } else {
    content += genScriptContent(key, id, value)
  }

  writeIn(road, format(content.replaceAll('\\', '\\\\'), 'dart'))
}

function genScript() {
  const Fx = IF.ctx.Fx
  const MF = IF.ctx.MF
  const util = IF.ctx.util

  Object.keys(Fx).forEach((id) => genJS('fx', id, Fx))
  Object.keys(MF).forEach((id) => genJS('mf', id, MF))
  Object.keys(util).forEach((id) => genJS('util', id, util, true))

  const fxRoad = getPath('common/FX.dart')
  const fxContent = genScriptDeps('fx', Object.keys(Fx), Fx, 'FX')
  const mfRoad = getPath('common/MF.dart')
  const mfContent = genScriptDeps('mf', Object.keys(MF), MF, 'MF')
  const utRoad = getPath('common/UT.dart')
  const utContent = genScriptDeps('util', Object.keys(util), util, 'UT', true)

  writeIn(fxRoad, format(fxContent, 'dart'))
  writeIn(mfRoad, format(mfContent, 'dart'))
  writeIn(utRoad, format(utContent, 'dart'))
}

export { genScript }
