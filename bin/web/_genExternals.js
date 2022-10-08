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
    const exmap = {};
    const enmap = {};
    const imap = {};
    const content = `${gvStr}
import UT from '../common/UT'
export const Dependents = {
  ${downloadAssets_1.externalList
        .map((o) => {
        const { filename, dir } = o;
        if (exmap[dir + filename])
            return '';
        exmap[dir + filename] = true;
        return `'${filename}': () => GV.inject('./lib/${dir}/${filename}', '${filename.endsWith('.css') ? 'link' : 'script'}'),`;
    })
        .filter((e) => e)
        .join('\n\t')}
}

export const Entrys = {
  ${downloadAssets_1.entryList
        .map((o) => {
        const { filename, dir } = o;
        if (enmap[dir + filename])
            return '';
        enmap[dir + filename] = true;
        return `'${filename}': () => import('./${dir}/${filename}'),`;
    })
        .filter((e) => e)
        .join('\n\t')}
  ${downloadAssets_1.innerEntryList
        .map((s) => {
        if (imap[s])
            return '';
        imap[s] = true;
        return `'${s}': ${s.substring(1).split('/').join('.')},`;
    })
        .filter((e) => e)
        .join('\n\t')}
}
  `;
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, mark));
}
exports.genExternals = genExternals;
