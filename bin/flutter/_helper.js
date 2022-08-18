"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genEvalStr = exports.heroCP = exports.expStringify = exports.genExp = exports.genetateSets = exports.getPath = void 0;
const path_1 = __importDefault(require("path"));
const helper_1 = require("../common/helper");
const downloadAssets_1 = require("../common/downloadAssets");
const _env_1 = require("./_env");
const getPath = (road) => path_1.default.resolve(`./lib/` + road);
exports.getPath = getPath;
function transformSets(_hid, sets) {
    const { status } = sets;
    status.forEach((statu) => {
        const { props } = statu;
        const { customKeys } = props.option;
        const { style } = props;
        const custom = customKeys || {};
        (0, downloadAssets_1.localizImage)(style, false);
        if (style.fontFamily) {
            downloadAssets_1.FontList[style.fontFamily] = true;
        }
        if (custom.fontFamily) {
            downloadAssets_1.FontList[custom.fontFamily] = true;
        }
    });
    return sets;
}
function genetateSets(hid, tree = {}, useTransform = true) {
    let target;
    try {
        target = (0, helper_1.fixHSS)(_env_1.IF.ctx.HSS[hid]);
    }
    catch (e) {
        console.log(e, hid, _env_1.IF.ctx.HSS[hid]);
    }
    if (target.type == 'level' && target.ghost) {
        target.status[0].props.style = {};
    }
    tree[hid] = useTransform ? transformSets(hid, target) : target;
    if (target && target.children && target.children.length) {
        target.children.forEach((id) => {
            genetateSets(id, tree, useTransform);
        });
    }
    return tree;
}
exports.genetateSets = genetateSets;
function genExp(exp, prefix = 'FN.parseModelStr', suffix = '') {
    const expList = exp.match(/\$\w+(-\w+)?(<.+?>)?/g) || [];
    exp = exp.split("'").join('`');
    expList.forEach((mds) => {
        // The $response in the expression uses the variable directly.
        if (mds == '$response') {
            exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${mds.substring(1)}`);
        }
        else {
            exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${prefix}('\\${mds}', e.hid, true)${suffix}`);
        }
    });
    return exp;
}
exports.genExp = genExp;
function genEvalStr(exp) {
    return `evalJS('${exp}')`;
}
exports.genEvalStr = genEvalStr;
const expStringify = (params, hid, jumpKeys = []) => {
    for (const attr in params) {
        const value = params[attr];
        const mark = '';
        if (!jumpKeys.includes(attr) &&
            typeof value == 'string' &&
            value != '$current' &&
            value.slice(0, 1) === '$' &&
            helper_1.parseExclude.filter((v) => value.includes(v)).length < 1) {
            params[attr] = `__R__parseModelStr('${mark}${value}', e.hid)__R__`;
        }
    }
    return (0, helper_1.processReplacement)(JSON.stringify(params, null, 2), hid);
};
exports.expStringify = expStringify;
const heroCP = {};
exports.heroCP = heroCP;
