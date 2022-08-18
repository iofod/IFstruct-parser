"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genViewContent = void 0;
/* eslint-disable prefer-const */
/* eslint-disable no-prototype-builtins */
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const _genEventContent_1 = require("./_genEventContent");
function genTag(_hid, tag) {
    return tag;
}
function genViewContent(lid, tree) {
    let eventContent = [];
    const genChildView = (hid, IN = '', DI = 0) => {
        const target = tree[hid] || _env_1.IF.ctx.HSS[hid];
        const { content, type, model, events, name } = target;
        let { remarks } = target;
        let [ui, cname] = content.split('/');
        let getTag;
        if (ui == 'base') {
            ui = 'IF';
        }
        else {
            // If it is not a base component, the lib prefix is not added,
            // as the requirement itself is self-contained.
            ui = '';
        }
        let hasCopy = false;
        if (model.hasOwnProperty('copy')) {
            hasCopy = true;
            DI += 1;
        }
        else {
            hasCopy = false;
        }
        const LM = helper_1.DIMap[DI]; // loop mark
        const CM_arr = (0, helper_1.getCloneMark)(DI);
        let CM = CM_arr.join(" + '|' + ");
        CM = DI > 0 ? "'|' + " + CM : "''";
        let str;
        const isMirror = content == 'base/mirror';
        const cloneMark = CM != "''" ? ` :clone="${CM}"` : ``;
        const tag = genTag(hid, `${ui}${cname}`);
        const { eventMarks, eventMethods } = (0, _genEventContent_1.genEventContent)(hid, events, CM);
        eventContent.push(...eventMethods);
        const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : ''; //eventBinding
        const CID = DI > 1
            ? `'${hid + "', " + CM_arr.slice(0, CM_arr.length - 1).join(', ')}`
            : `'${hid}'`; // copy 比普通的 model 小一个维度，所以这里判定条件为 1
        if (type == 'unit' && !isMirror) {
            const unitHead = `${IN}\t<${tag} class="U-unit" hid="${hid}"${EBD}`;
            if (hasCopy) {
                str = `${unitHead} v-for="(_, ${LM}) in CID(${CID})" :key="'${hid}' + ${CM}"${cloneMark}></${tag}>`;
            }
            else {
                str = `${unitHead}${cloneMark}></${tag}>`;
            }
        }
        else {
            // container or mirror
            IN += '\t';
            const inject = isMirror ? ' class="U-unit"' : '';
            const wrapHead = `${IN}<${tag}${inject} hid="${hid}"${EBD}`;
            if (hasCopy) {
                getTag = (v) => `${wrapHead} v-for="(_, ${LM}) in CID(${CID})" :key="'${hid}' + ${CM}"${cloneMark}>${v}</${tag}>`;
            }
            else {
                getTag = (v) => `${wrapHead}${cloneMark}>${v}</${tag}>`;
            }
            if (isMirror) {
                const uv = target.model.use.value;
                if (_env_1.IF.ctx.HSS[uv]) {
                    str = getTag(`${IN}\n` + genChildView(uv, IN, DI) + `\n${IN}`);
                }
                else {
                    str = getTag(``);
                }
            }
            else {
                // container
                let comment = ``;
                if (name != '容器' && name != 'container') {
                    let rtxt = ` `;
                    if (remarks) {
                        remarks = remarks.split('\n').join(`\n${IN}`);
                        rtxt = ` : \n${IN}${remarks}\n${IN}`;
                    }
                    comment = `${IN}<!-- ${name}${rtxt}-->\n`;
                }
                if (target.children && target.children.length) {
                    str =
                        `${comment}` +
                            getTag(target.children
                                .map((id) => `\n` + genChildView(id, IN, DI))
                                .join('') + `\n${IN}`);
                }
                else {
                    str = `${comment}` + getTag(``);
                }
            }
        }
        return str;
    };
    const childview = tree[lid].children
        .map((cid) => genChildView(cid, '\t', 0))
        .join('\n');
    const { eventMarks, eventMethods } = (0, _genEventContent_1.genEventContent)(lid, tree[lid].events, 'clone');
    eventContent.push(...eventMethods);
    const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : ''; //eventBinding
    const str = [...new Set(eventContent)].join(',');
    const readyContent = [];
    let created = ``;
    const genCreated = () => {
        if (!_genEventContent_1.CE_list.length)
            return;
        const { eventMethods } = (0, _genEventContent_1.genEventContent)(lid, _genEventContent_1.CE_list, 'clone', false);
        const genStr = (str) => `
		created() {
			${str}
		},`;
        let str = ``;
        [..._genEventContent_1.CE_list].forEach((evo, I) => {
            const { hid, event, mds, target, once } = evo;
            const subscriber = once ? 'FN.PS.subscribeOnce' : 'FN.PS.subscribe';
            const fn_name = eventMethods[I].replace('async', 'async function');
            const sub_name = event == 'modelchange' ? `${target || hid}.${mds}.${event}` : event;
            str += `
			FN.PS.unsubscribe(FN.PS_ID.${hid}_${event})
			FN.PS_ID.${hid}_${event} = ${subscriber}('${sub_name}', this.GEV(${fn_name}))`;
            _genEventContent_1.CE_list.pop();
        });
        created = genStr(str);
    };
    genCreated();
    const Lmark = genTag(lid, 'IFlevel');
    return `<template>
  <${Lmark} class="wrap" hid="${lid}" :clone="clone" :style="STYLE"${EBD}>
${childview}
  </${Lmark}>
</template>

<script>
import FN from '@common/FN'
import FA from '@common/FA'
import FX from '@common/FX'
import MF from '@common/MF'
import UT from '@common/UT'

export default {${created}
  methods: {
    ${str}
	},
	mounted() {
		${readyContent}
	}
}
</script>
`;
}
exports.genViewContent = genViewContent;
