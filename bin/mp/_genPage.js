"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genPages = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const _helper_1 = require("./_helper");
function genPageContent(pid, levels, levelTag, levelImport) {
    return `
<template>
  <view class="page" pid="${pid}" @touchstart="touchstart" @touchmove="touchmove" @touchend="touchend" @touchcancel="touchcancel">
    ${levelTag.join('\n\t\t')}
		<VGlobal hid="Global" :clone="''"></VGlobal>
    <PreviewCursor key="${pid}"></PreviewCursor>
  </view>
</template>

<script>
import FN from '@common/FN'
import { MouseMixin } from '../../mouse'
${levelImport.join('\n')}
import VGlobal from '../../view/Global.vue'
import PreviewCursor from '../../components/cursor.vue'

export default {
	mixins: [MouseMixin],
  components: {
    ${levels.join(',\n\t\t')},
		VGlobal,
    PreviewCursor
  },
	created() {
		FN.setContext(this)
	}
}
</script>`;
}
function genPages() {
    _env_1.IF.ctx.pages.forEach(async (pid) => {
        const target = _env_1.IF.ctx.HSS[pid];
        const levels = [];
        const levelTag = [];
        const levelTagName = [];
        const levelImport = [];
        target.children.forEach((hid) => {
            const tag = `V${hid}`;
            levels.push(hid);
            levelTagName.push(tag);
            levelTag.push(`<!-- ${_env_1.IF.ctx.HSS[hid].name} -->`, `<${tag} hid="${hid}" :clone="''"></${tag}>`);
            levelImport.push(`import ${tag} from '../../view/${hid}.vue'`);
            (0, _helper_1.genView)(hid);
        });
        await (0, helper_1.mkdir)('pages/' + pid);
        const content = genPageContent(pid, levelTagName, levelTag, levelImport);
        const road = (0, helper_1.getPath)('pages/' + pid + '/index.vue');
        const config = (0, helper_1.getPath)('pages/' + pid + '/index.config.js');
        (0, helper_1.writeIn)(road, (0, helper_1.format)(content, 'vue'));
        (0, helper_1.writeIn)(config, (0, helper_1.format)(`export default {
    navigationBarTitleText: '${_env_1.IF.ctx.HSS[pid].name}'
  }
  `, 'js'));
    });
}
exports.genPages = genPages;
