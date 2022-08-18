"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initData = void 0;
const path_1 = __importDefault(require("path"));
const downloadAssets_1 = require("../common/downloadAssets");
const helper_1 = require("../common/helper");
const IFstruct_1 = require("../common/IFstruct");
const _env_1 = require("./_env");
const getAssetsPath = (road) => path_1.default.resolve(`./public/assets/` + road);
const getEntrysPath = (road) => path_1.default.resolve(`./src/externals/` + road);
const getExternalsPath = (road) => path_1.default.resolve(`./public/lib/` + road);
async function initData(payload, config) {
    const { cache, selected, useRemote } = config;
    _env_1.IF.ctx = new IFstruct_1.IFstruct(payload);
    _env_1.IF.useRemote = useRemote;
    if (!cache)
        (0, helper_1.cleanWriteMap)();
    if (selected.includes('PC')) {
        _env_1.IF.planform = 'pc';
        _env_1.IF.unit = 'px';
    }
    if (selected.includes('Vue3')) {
        _env_1.IF.framework = 'Vue3';
    }
    (0, downloadAssets_1.setIFTarget)(_env_1.IF.target);
    await main();
    return true;
}
exports.initData = initData;
const _genPage_1 = require("./_genPage");
const _genRoutes_1 = require("./_genRoutes");
const _genStore_1 = require("./_genStore");
const _genScript_1 = require("./_genScript");
const _genExternals_1 = require("./_genExternals");
const _genInjectCSS_1 = require("./_genInjectCSS");
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
    (0, _genExternals_1.genExternals)();
    (0, _genInjectCSS_1.genInjectCSS)();
    if (!_env_1.IF.useRemote) {
        await (0, downloadAssets_1.downloadAssets)(getAssetsPath);
        await (0, downloadAssets_1.downloadFonts)(getAssetsPath, 'woff');
    }
    await (0, downloadAssets_1.downloadEntrys)(getEntrysPath);
    await (0, downloadAssets_1.downloadExternals)(getExternalsPath);
    (0, _genIA_1.genIA)();
    console.timeEnd('gen');
    console.log('Done!');
}
