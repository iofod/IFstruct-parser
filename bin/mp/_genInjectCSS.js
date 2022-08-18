"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genInjectCSS = void 0;
const helper_1 = require("../common/helper");
const _helper_1 = require("./_helper");
const _env_1 = require("./_env");
const downloadAssets_1 = require("../common/downloadAssets");
function genInjectCSS() {
    const { bgc, gft = 'inherit' } = _env_1.IF.ctx.Config.setting;
    const IARoad = (0, helper_1.getPath)('style/inject.less');
    const bgContent = `.page { background-color: ${bgc}; }\n.U-unit { font-family: ${gft};}\n\n`;
    // If you want to load web fonts dynamically, the file address needs to be the download type.
    // https://developers.weixin.qq.com/miniprogram/dev/api/ui/font/wx.loadFontFace.html
    const fontContent = Object.keys(downloadAssets_1.FontList)
        .filter((name) => name != 'inherit')
        .map((name) => {
        const url = `${downloadAssets_1.FontCDN}fonts/${name}.woff`;
        return `@font-face {font-family: '${name}';src:url('${url}')};`;
    })
        .join('\n\n');
    const hidCssContent = Object.keys(_helper_1.LOCAL_CSS_RULE)
        .map((rid) => {
        const obj = _helper_1.LOCAL_CSS_RULE[rid];
        const list = [];
        for (const key in obj) {
            list.push(`\t${key}: ${obj[key]};`);
        }
        return `.${rid} {
${list.join('\n')}
}`;
    })
        .join('\n\n');
    (0, helper_1.writeIn)(IARoad, (0, helper_1.format)(bgContent + fontContent + hidCssContent));
}
exports.genInjectCSS = genInjectCSS;
