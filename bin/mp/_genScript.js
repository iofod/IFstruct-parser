"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genScript = void 0;
/* eslint-disable prefer-const */
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
function genScriptDeps(prefix, ids, dict, namespace, useWindow = false) {
    const injectDeps = ids.map((id) => {
        const { dir, key } = dict[id];
        return `import ${id} from './${prefix}${dir || ''}/${key}' `;
    });
    const roadMap = {};
    ids.map((id) => {
        const { dir, key } = dict[id];
        let p = roadMap;
        const arr = dir ? dir.split('/').filter((e) => e) : [];
        arr.forEach((d) => {
            p[d] = p[d] || {};
            p = p[d];
        });
        p[key] = `__R__${namespace}.${id}__R__`;
    });
    let body = `

	`;
    if (useWindow) {
        body += `
const ${namespace} = {
	${ids.join(',\n')}
}
`;
    }
    else {
        body += `
import FA from './FA'

const ${namespace} = {
	...FA.promisify({
		${ids.join(',\n')}
	})
}
`;
    }
    return `
${injectDeps.join('\n')}
${body}
export default ${JSON.stringify(roadMap, null, 2)
        .replaceAll('"__R__', '')
        .replaceAll('__R__"', '')}
`;
}
async function genJS(prefix, id, dict, useWindow = false) {
    let { key, value, dir } = dict[id];
    const diff = dict[id]['△'];
    value = (0, helper_1.mergeDiff)(value, diff);
    let road;
    if (dir) {
        const fdir = 'common/' + prefix + dir + '/';
        road = (0, helper_1.getPath)('common/' + prefix + dir + '/' + key + '.js');
        await (0, helper_1.mkdir)(fdir);
    }
    else {
        road = (0, helper_1.getPath)('common/' + prefix + '/' + key + '.js');
    }
    let content;
    const preDepend = `import SDK from '@common/SDK'\nimport FN from '@common/FN'\nimport UT from '@common/UT'\nconst window = { SDK, FN, UT }`;
    if (useWindow) {
        content = `${preDepend}\n//${key}\nexport default function(data) {\n${value}\n}`;
    }
    else {
        content = `${preDepend}\n//${key}\nexport default async function(data, next) {\n${value}\n}`;
    }
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, 'js'));
}
function genScript() {
    const Fx = _env_1.IF.ctx.Fx;
    const MF = _env_1.IF.ctx.MF;
    const util = _env_1.IF.ctx.util;
    Object.keys(Fx).forEach((id) => genJS('fx', id, Fx));
    Object.keys(MF).forEach((id) => genJS('mf', id, MF));
    Object.keys(util).forEach((id) => genJS('util', id, util, true));
    const fxRoad = (0, helper_1.getPath)('common/FX.js');
    const fxContent = genScriptDeps('fx', Object.keys(Fx), Fx, 'FX');
    const mfRoad = (0, helper_1.getPath)('common/MF.js');
    const mfContent = genScriptDeps('mf', Object.keys(MF), MF, 'MF');
    const utRoad = (0, helper_1.getPath)('common/UT.js');
    const utContent = genScriptDeps('util', Object.keys(util), util, 'UT', true);
    (0, helper_1.writeIn)(fxRoad, (0, helper_1.format)(fxContent, 'js'));
    (0, helper_1.writeIn)(mfRoad, (0, helper_1.format)(mfContent, 'js'));
    (0, helper_1.writeIn)(utRoad, (0, helper_1.format)(utContent, 'js'));
}
exports.genScript = genScript;
