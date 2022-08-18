"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initData = void 0;
const path_1 = __importDefault(require("path"));
const IFstruct_1 = require("../common/IFstruct");
const _env_1 = require("./_env");
const helper_1 = require("../common/helper");
const downloadAssets_1 = require("../common/downloadAssets");
const _genPage_1 = require("./_genPage");
const _genRoutes_1 = require("./_genRoutes");
const _genStore_1 = require("./_genStore");
const _genScript_1 = require("./_genScript");
const _genEV_1 = require("./_genEV");
const _genInjectPubspec_1 = require("./_genInjectPubspec");
const getAssetsPath = (road) => path_1.default.resolve(`./assets/` + road);
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
async function main() {
    console.time('gen');
    const { gft } = _env_1.IF.ctx.Config.setting;
    if (gft)
        downloadAssets_1.FontList[gft] = true;
    (0, _genPage_1.genPages)();
    (0, _genRoutes_1.genRoutes)();
    (0, _genScript_1.genScript)();
    (0, _genEV_1.genEV)();
    (0, _genStore_1.genStore)();
    await (0, downloadAssets_1.downloadAssets)(getAssetsPath);
    await (0, downloadAssets_1.downloadFonts)(getAssetsPath, 'ttf');
    (0, _genInjectPubspec_1.genInjectPubspec)();
    console.timeEnd('gen');
    console.log('Done!');
}
