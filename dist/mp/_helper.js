"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCAL_CSS_RULE = exports.genView = exports.traveSets = exports.genetateSets = exports.IA_LIST = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const downloadAssets_1 = require("../common/downloadAssets");
const buildStyle_1 = require("../common/buildStyle");
const _temp_1 = require("./_temp");
const IA_LIST = [];
exports.IA_LIST = IA_LIST;
const LOCAL_ATTR_LIST = [
    'backdropFilter',
    'filter',
    'maskSize',
    'maskImage',
    'maskRepeat',
];
const LOCAL_CSS_RULE = {};
exports.LOCAL_CSS_RULE = LOCAL_CSS_RULE;
function hump2Line(name) {
    return name.replace(/([A-Z])/g, '-$1').toLowerCase();
}
function transformSets(hid, sets) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = {};
    const { status, model, type, layout, children, ghost, content } = sets;
    target.model = {};
    target.content = content;
    for (const key in model) {
        const { value, subscribe } = model[key];
        target.model[key] = {
            value,
            use: subscribe,
        };
    }
    if (type == 'level') {
        target.layout = (0, helper_1.getLayout)(layout);
    }
    target.children = children;
    target.status = status.map((statu) => {
        const { name, id, active, props } = statu;
        const { customKeys, V, IAA, IAD } = props.option;
        const { x, y, tx, ty, d, s, style } = props;
        style.x = x;
        style.y = y;
        style.tx = tx;
        style.ty = ty;
        style.d = d;
        style.s = s;
        if (ghost) {
            style.pointerEvents = 'none';
        }
        else {
            delete style.pointerEvents;
        }
        if (V === false) {
            style.visibility = 'hidden';
        }
        else {
            delete style.visibility;
        }
        const custom = customKeys || {};
        const localID = hid + '-' + id;
        const css = {
            ...style,
            ...custom,
        };
        (0, buildStyle_1.px2any)(css, _env_1.IF.unit);
        LOCAL_ATTR_LIST.forEach((key) => {
            if (typeof css[key] == 'string') {
                if (!LOCAL_CSS_RULE[localID])
                    LOCAL_CSS_RULE[localID] = {};
                const value = _env_1.IF.ctx.parseModelExp(css[key], hid);
                LOCAL_CSS_RULE[localID][hump2Line(key)] = value;
                delete style[key];
                delete custom[key];
            }
        });
        (0, buildStyle_1.px2any)(style, _env_1.IF.unit);
        if (style.fontFamily) {
            downloadAssets_1.FontList[style.fontFamily] = true;
        }
        if (custom.fontFamily) {
            downloadAssets_1.FontList[custom.fontFamily] = true;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = {
            name,
            id: id || 'default',
            active,
            custom,
            style,
        };
        if (IAA) {
            config.IAA = IAA;
            IA_LIST.push(IAA.split(' ')[0]);
        }
        if (IAD) {
            config.IAD = IAD;
            IA_LIST.push(IAD.split(' ')[0]);
        }
        return config;
    });
    return target;
}
function genetateSets(hid, tree = {}, useTransform = true) {
    let target;
    try {
        target = JSON.parse(JSON.stringify((0, helper_1.fixHSS)(_env_1.IF.ctx.HSS[hid])));
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
function genView(lid) {
    const road = (0, helper_1.getPath)('view/' + lid + '.vue');
    const tree = genetateSets(lid, {}, false);
    const gtree = genetateSets('Global', {}, false);
    const content = (0, _temp_1.genViewContent)(lid, {
        ...gtree,
        ...tree,
    });
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, 'vue'));
}
exports.genView = genView;
function traveSets(hid, callback) {
    const target = _env_1.IF.ctx.HSS[hid];
    callback(hid, target);
    if (target && target.children && target.children.length) {
        target.children.forEach((id) => {
            traveSets(id, callback);
        });
    }
}
exports.traveSets = traveSets;
