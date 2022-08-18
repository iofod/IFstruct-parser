"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initData = void 0;
const downloadAssets_1 = require("../common/downloadAssets");
const helper_1 = require("../common/helper");
const IFstruct_1 = require("../common/IFstruct");
const _env_1 = require("./_env");
async function initData(payload, config) {
    const { cache } = config;
    _env_1.IF.ctx = new IFstruct_1.IFstruct(payload);
    if (!cache)
        (0, helper_1.cleanWriteMap)();
    (0, downloadAssets_1.setIFTarget)(_env_1.IF.target);
    await main();
    return true;
}
exports.initData = initData;
const _genPage_1 = require("./_genPage");
const _genRoutes_1 = require("./_genRoutes");
const _genStore_1 = require("./_genStore");
const _genScript_1 = require("./_genScript");
const _genInjectCSS_1 = require("./_genInjectCSS");
const _genExpsMap_1 = require("./_genExpsMap");
const _genIA_1 = require("./_genIA");
async function main() {
    console.time('gen');
    const { gft } = _env_1.IF.ctx.Config.setting;
    if (gft)
        downloadAssets_1.FontList[gft] = true;
    (0, _genPage_1.genPages)();
    (0, _genRoutes_1.genRoutes)();
    (0, _genStore_1.genStore)();
    (0, _genScript_1.genScript)();
    (0, _genInjectCSS_1.genInjectCSS)();
    (0, _genExpsMap_1.genExpsMap)();
    (0, _genIA_1.genIA)();
    console.timeEnd('gen');
    console.log('Done!');
}
