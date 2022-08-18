"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genInjectCSS = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const downloadAssets_1 = require("../common/downloadAssets");
function genInjectCSS() {
    const { bgc, gft = 'inherit' } = _env_1.IF.ctx.Config.setting;
    const IARoad = (0, helper_1.getPath)('style/inject.less');
    const bgContent = `html,body { background-color: ${bgc};}\n.U-unit { font-family: ${gft};}\n`;
    const fontContent = Object.keys(downloadAssets_1.FontList)
        .filter((name) => name != 'inherit')
        .map((name) => {
        const url = _env_1.IF.useRemote
            ? `${downloadAssets_1.FontCDN}fonts/${name}.woff2`
            : `/assets/${name}.woff`;
        return `@font-face {font-family: '${name}';src:url('${url}')};`;
    })
        .join('\n');
    (0, helper_1.writeIn)(IARoad, (0, helper_1.format)(bgContent + fontContent));
}
exports.genInjectCSS = genInjectCSS;
