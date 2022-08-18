"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genScript = void 0;
/* eslint-disable prefer-const */
const helper_1 = require("../common/helper");
const _helper_1 = require("./_helper");
const _env_1 = require("./_env");
function genScriptDeps(prefix, ids, dict, namespace, useWindow = false) {
    const injectDeps = ids.map((id) => {
        const { dir, key } = dict[id];
        return `import './${prefix}${dir || ''}/${key}.dart';`;
    });
    const roadMap = {};
    const jsRoadMap = {};
    ids.map((id) => {
        const { dir, key } = dict[id];
        let p = roadMap;
        let q = jsRoadMap;
        const arr = dir ? dir.split('/').filter((e) => e) : [];
        // Generate Catalog
        arr.forEach((d) => {
            p[d] = p[d] || {};
            q[d] = q[d] || {};
            p = p[d];
            q = q[d];
        });
        p[key] = `__R___${namespace}['${id}']__R__`;
        q[key] = `__R__${namespace}.${id}__R__`;
    });
    let body = `
// ignore_for_file: unused_element
import './FA.dart';
	`;
    const idMap = ids.map((id) => `"${id}": ${id}`).join(',\n');
    if (useWindow) {
        body = `
const UT = {
	${ids.map((id) => `${id}(data) {\n$${id}\n}`).join(',\n')}
}
		`;
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
		`;
    }
    else {
        body += `
final _${namespace} = FA.promisify({
	${idMap}
});
`;
        return `
	${injectDeps.join('\n')}
	${body}
	final ${namespace} = ${JSON.stringify(roadMap, null, 2)
            .replaceAll('"__R__', '')
            .replaceAll('__R__"', '')};
	`;
    }
}
function genScriptContent(_key, id, value) {
    //Replace the function body with the convention mode.
    const str = value
        .replace(/next\(\)/g, 'callBridge("$token")')
        .replace(/next\(/g, 'callBridge("$token", ');
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
`;
}
async function genJS(prefix, id, dict, useWindow = false) {
    let { key, value, dir } = dict[id];
    const diff = dict[id]['△'];
    value = (0, helper_1.mergeDiff)(value, diff).replaceAll('$', '\\$');
    let road;
    if (dir) {
        const fdir = 'common/' + prefix + dir + '/';
        road = (0, _helper_1.getPath)('common/' + prefix + dir + '/' + key + '.dart');
        await (0, helper_1.mkdir)(fdir);
    }
    else {
        road = (0, _helper_1.getPath)('common/' + prefix + '/' + key + '.dart');
    }
    let content = `import 'package:myapp/common/FN.dart';`;
    if (useWindow) {
        content = `const ${id} = '''\n${value}\n''';`;
    }
    else {
        content += genScriptContent(key, id, value);
    }
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content.replaceAll('\\', '\\\\'), 'dart'));
}
function genScript() {
    const Fx = _env_1.IF.ctx.Fx;
    const MF = _env_1.IF.ctx.MF;
    const util = _env_1.IF.ctx.util;
    Object.keys(Fx).forEach((id) => genJS('fx', id, Fx));
    Object.keys(MF).forEach((id) => genJS('mf', id, MF));
    Object.keys(util).forEach((id) => genJS('util', id, util, true));
    const fxRoad = (0, _helper_1.getPath)('common/FX.dart');
    const fxContent = genScriptDeps('fx', Object.keys(Fx), Fx, 'FX');
    const mfRoad = (0, _helper_1.getPath)('common/MF.dart');
    const mfContent = genScriptDeps('mf', Object.keys(MF), MF, 'MF');
    const utRoad = (0, _helper_1.getPath)('common/UT.dart');
    const utContent = genScriptDeps('util', Object.keys(util), util, 'UT', true);
    (0, helper_1.writeIn)(fxRoad, (0, helper_1.format)(fxContent, 'dart'));
    (0, helper_1.writeIn)(mfRoad, (0, helper_1.format)(mfContent, 'dart'));
    (0, helper_1.writeIn)(utRoad, (0, helper_1.format)(utContent, 'dart'));
}
exports.genScript = genScript;
