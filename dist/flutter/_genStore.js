"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genStore = void 0;
const helper_1 = require("../common/helper");
const _helper_1 = require("./_helper");
const downloadAssets_1 = require("../common/downloadAssets");
const _env_1 = require("./_env");
function traveSets(hid, callback) {
    const target = _env_1.IF.ctx.HSS[hid];
    callback(hid, target);
    if (target && target.children && target.children.length) {
        target.children.forEach((id) => {
            traveSets(id, callback);
        });
    }
}
function formatObj2DartStr(obj) {
    return JSON.stringify(obj, function (_k, v) {
        if (typeof v == 'string') {
            return v.replace(/"/g, '\\"');
        }
        return v;
    }, 2)
        .replace(/\$/g, '\\$')
        .replace(/\\\\/g, '\\'); //hack for jsonDecode
}
function genStoreContent() {
    const model = {};
    const TB = _env_1.IF.ctx.table;
    for (const mid in TB) {
        const obj = TB[mid];
        model[obj.key] = {
            id: mid,
            subscriber: obj.subscriber,
        };
    }
    const mstr = formatObj2DartStr(model);
    const config = {};
    const hero = {};
    const tree = {};
    const setStore = (hid) => {
        traveSets(hid, (hid, target) => {
            const obj = {
                ...target,
            };
            delete obj.remarks;
            (0, downloadAssets_1.localizModel)(obj.model, false);
            tree[hid] = obj;
        });
    };
    _env_1.IF.ctx.pages.forEach((pid) => {
        const tags = {};
        let hasTag = false;
        // The tags of each page are independent of each other, i.e.,
        // they can be unique within a page, but not between pages.
        // The best practice is to keep it globally unique.
        traveSets(pid, (hid, target) => {
            const tag = target.model.tag;
            if (tag) {
                hasTag = true;
                const vid = tag.value;
                if (vid) {
                    tags[vid] = hid;
                    hero[hid] = vid;
                }
            }
        });
        if (hasTag) {
            config[pid] = tags;
        }
        setStore(pid);
    });
    setStore('Global');
    const cfstr = formatObj2DartStr(_env_1.IF.ctx.Config.setting);
    const hsstr = formatObj2DartStr(tree);
    const heroStr = formatObj2DartStr(hero);
    const heroCPStr = formatObj2DartStr(_helper_1.heroCP);
    return `import 'dart:convert';

var projectTree = jsonDecode('''${hsstr}
''');
var projectModel = jsonDecode('''${mstr}
''');
var projectConfig = jsonDecode('''${cfstr}
''');
var heroTagsMap = jsonDecode('''${heroStr}
''');
var heroCP = jsonDecode('''${heroCPStr}
''');

`;
}
function genStore() {
    const road = (0, _helper_1.getPath)('store/tree.dart');
    const content = genStoreContent();
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, 'dart'));
}
exports.genStore = genStore;
