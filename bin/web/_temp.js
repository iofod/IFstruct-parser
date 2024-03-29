"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genViewContent = void 0;
/* eslint-disable no-prototype-builtins */
/* eslint-disable prefer-const */
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const _genActionList_1 = require("./_genActionList");
let tree;
const customEvent = ['routechange', 'modelchange'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CE_list = []; // Non-native events
function genEventContent(hid, events, cloneMark, jumpCE = true) {
    const eventMarks = [];
    const eventMethods = [];
    const isVue3 = _env_1.IF.framework == 'Vue3';
    events.forEach((evo) => {
        if (jumpCE && customEvent.includes(evo.event)) {
            evo.hid = hid;
            CE_list.push(evo);
            return;
        }
        hid = evo.hid || hid;
        let { event, actions, native } = evo;
        let prefix;
        switch (event) {
            case 'start':
                event = 'touchstart';
                break;
            case 'end':
                event = 'touchend';
                break;
            default:
                break;
        }
        const isGesture = helper_1.Gesture.includes(event);
        if (isGesture) {
            prefix = `v-GT-${event}`;
        }
        else {
            prefix = `@${event}${native === false || isVue3 ? '' : '.native'}`;
        }
        ;
        ['passive', 'capture', 'once', 'prevent', 'stop', 'self'].forEach((key) => {
            if (evo[key]) {
                prefix += '.' + key;
            }
        });
        const methodName = `${event}_${hid}`;
        const mark = cloneMark === `''` ? '' : `, ${cloneMark}`;
        if (isGesture) {
            eventMarks.push(`${prefix}="GEV(${methodName}${mark})"`);
        }
        else {
            eventMarks.push(`${prefix}="EV($event, ${methodName}${mark})"`);
        }
        const execBody = (0, _genActionList_1.genActionList)(hid, actions);
        const acStr = JSON.stringify(actions);
        const use$Response = acStr.includes('$response') ||
            acStr.includes('function') ||
            acStr.includes('service');
        const methodBody = `async ${methodName}(e) {
      ${use$Response ? 'let response\n' : ''}${execBody.join('\n')}
    }`;
        eventMethods.push(methodBody);
    });
    return {
        eventMarks,
        eventMethods,
    };
}
function genTag(hid, tag) {
    const flag = _env_1.IF.ctx.HSS[hid].status.filter((statu) => statu.props.option.IAA || statu.props.option.IAA).length;
    return flag ? 'A' + tag : tag;
}
function genChildView(hid, IN = '', DI = 0, eventContent) {
    const target = tree[hid] || _env_1.IF.ctx.HSS[hid];
    let { content, type, model, events, name, remarks } = target;
    let [ui, cname] = content.split('/');
    let getTag;
    // 内置系统UI的别名
    if (ui == 'base') {
        ui = 'IF';
    }
    else {
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
    const { eventMarks, eventMethods } = genEventContent(hid, events, CM);
    eventContent.push(...eventMethods);
    const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : ''; //eventBinding
    const CID = DI > 1
        ? `'${hid + "', " + CM_arr.slice(0, CM_arr.length - 1).join(', ')}`
        : `'${hid}'`;
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
                str = getTag(`${IN}\n` + genChildView(uv, IN, DI, eventContent) + `\n${IN}`);
            }
            else {
                console.log(uv, 'is invalid');
                str = getTag(``);
            }
        }
        else {
            // container
            let comment = ``;
            // 去掉默认值
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
                            .map((id) => `\n` + genChildView(id, IN, DI, eventContent))
                            .join('') + `\n${IN}`);
            }
            else {
                str = `${comment}` + getTag(``);
            }
        }
    }
    return str;
}
function genCreated(lid) {
    if (!CE_list.length)
        return ``;
    const { eventMethods } = genEventContent(lid, CE_list, 'clone', false);
    let str = ``;
    CE_list.forEach((evo, I) => {
        const { hid, event, mds, target, once } = evo;
        const subscriber = once ? 'FN.PS.subscribeOnce' : 'FN.PS.subscribe';
        const fn_name = eventMethods[I].replace('async', 'async function');
        const sub_name = event == 'modelchange' ? `${target || hid}.${mds}.${event}` : event;
        str += `
    window.FN.PS.unsubscribe(FN.PS_ID.${hid}_${event})
    window.FN.PS_ID.${hid}_${event} = ${subscriber}('${sub_name}', this.GEV(${fn_name}))`;
    });
    CE_list = [];
    return `
  created() {
    ${str}
  },`;
}
function genViewContent(lid, payload) {
    tree = payload;
    let eventContent = [];
    const childview = tree[lid].children
        .map((cid) => genChildView(cid, '\t', 0, eventContent))
        .join('\n');
    const { eventMarks, eventMethods } = genEventContent(lid, tree[lid].events, 'clone');
    eventContent.push(...eventMethods);
    const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : ''; //eventBinding
    const str = [...new Set(eventContent)].join(',');
    const Lmark = genTag(lid, 'IFlevel');
    return `<template>
  <${Lmark} class="wrap" hid="${lid}" :clone="clone" :style="STYLE"${EBD}>
  <div class="frame" :style="LAYOUT">
${childview}
  </div>
  </${Lmark}>
</template>

<script>
import { wrapProxy } from '../lib/auto/index'
import FA from '../common/FA'
import FX from '../common/FX'
import MF from '../common/MF'

export default {${genCreated(lid)}
  methods: wrapProxy({
    ${str}
	}),
	mounted() { }
}
</script>
`;
}
exports.genViewContent = genViewContent;
