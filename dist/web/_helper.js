"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IA_LIST = exports.traveSets = exports.genView = exports.genetateSets = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const downloadAssets_1 = require("../common/downloadAssets");
const _temp_1 = require("./_temp");
const buildStyle_1 = require("../common/buildStyle");
const IA_LIST = [];
exports.IA_LIST = IA_LIST;
function transformSets(_hid, sets) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = {};
    const { status, model, type, layout, ghost, children, content, externals } = sets;
    target.model = {};
    for (const key in model) {
        const { value, subscribe } = model[key];
        target.model[key] = {
            value,
            use: subscribe,
        };
    }
    if (!_env_1.IF.useRemote) {
        (0, downloadAssets_1.localizModel)(target.model);
    }
    if (content == 'base/exterior') {
        (0, downloadAssets_1.localizModules)(target.model);
        if (externals) {
            target.externals = (0, downloadAssets_1.localizExternals)(externals);
        }
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
        // Since overflow is invalid for mobile ios, here clipPath is used instead, supported by ios7 and above.
        if (style.overflow == 'hidden' && _env_1.IF.planform == 'phone') {
            style.clipPath = 'inset(0px)';
        }
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
        (0, buildStyle_1.px2any)(style, _env_1.IF.unit);
        (0, downloadAssets_1.localizImage)(style);
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
