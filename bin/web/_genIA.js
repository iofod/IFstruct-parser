"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genIA = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const css_1 = __importDefault(require("css"));
const helper_1 = require("../common/helper");
const _helper_1 = require("./_helper");
function genIA() {
    const $IA_LIST = _helper_1.IA_LIST.map((v) => '.' + v);
    const cssBuff = fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../assets/merge.IA.css'));
    const cssVal = cssBuff.toString();
    const cssLines = cssVal.split('\n');
    const cssAst = css_1.default.parse(cssVal);
    const injectIAList = [];
    cssAst.stylesheet.rules.forEach((obj) => {
        if ((obj.type == 'keyframes' && _helper_1.IA_LIST.includes(obj.name)) ||
            (obj.type == 'rule' && $IA_LIST.includes(obj.selectors[0]))) {
            const { start, end } = obj.position;
            const str = cssLines.slice(start.line - 1, end.line).join('\n');
            injectIAList.push(str);
        }
    });
    const IARoad = (0, helper_1.getPath)('style/IA.css');
    (0, helper_1.writeIn)(IARoad, injectIAList.join('\n'));
}
exports.genIA = genIA;
