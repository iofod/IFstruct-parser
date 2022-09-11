"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genPages = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const _helper_1 = require("./_helper");
function genPageContent(pid, levels, levelTag, levelImport, tree) {
    return `<template>
  <div class="page">
    ${levelTag.join('\n\t\t')}
  </div>
</template>

<script>
import FN from '../common/FN'
${levelImport.join('\n')}

FN.PS.publishSync('updatePage', { tree: ${JSON.stringify(tree, null, 2)}, pid: "${pid}"})

export default {
  components: {
    ${levels.join(',\n\t\t')}
  }
}
</script>`;
}
function genPages() {
    _env_1.IF.ctx.pages.forEach((pid) => {
        const tree = _env_1.IF.ctx.HSS[pid];
        const levels = [];
        const levelTag = [];
        const levelTagName = [];
        const levelImport = [];
        tree.children.forEach((hid) => {
            const tag = `V${hid}`;
            levels.push(hid);
            levelTagName.push(tag);
            levelTag.push(`<!-- ${_env_1.IF.ctx.HSS[hid].name} -->`, `<${tag} hid="${hid}" :clone="''"></${tag}>`);
            levelImport.push(`import ${tag} from '../view/${hid}.vue'`);
            (0, _helper_1.genView)(hid);
        });
        const subTree = (0, _helper_1.genetateSets)(pid);
        const content = genPageContent(pid, levelTagName, levelTag, levelImport, subTree);
        const road = (0, helper_1.getPath)('pages/' + pid + '.vue');
        (0, helper_1.writeIn)(road, (0, helper_1.format)(content, 'vue'));
    });
}
exports.genPages = genPages;
