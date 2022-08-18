"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genExternals = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const downloadAssets_1 = require("../common/downloadAssets");
function genExternals() {
    const useTs = _env_1.IF.framework == 'Vue3';
    const mark = useTs ? 'ts' : 'js';
    const road = (0, helper_1.getPath)('externals/index.' + mark);
    const gvStr = useTs ? `import GV from '../lib/GV'\n` : '';
    const content = `${gvStr}export const Dependents = {
  ${downloadAssets_1.externalList
        .map((o) => {
        const { filename, dir } = o;
        return `'${filename}': () => GV.inject('./lib/${dir}/${filename}', '${filename.endsWith('.css') ? 'link' : 'script'}')`;
    })
        .join(',\n\t')}
}

export const Entrys = {
  ${downloadAssets_1.entryList
        .map((o) => {
        const { filename, dir } = o;
        return `'${filename}': () => import('./${dir}/${filename}')`;
    })
        .join(',\n\t')}
}
  `;
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, mark));
}
exports.genExternals = genExternals;
