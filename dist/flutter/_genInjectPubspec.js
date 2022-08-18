"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genInjectPubspec = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const downloadAssets_1 = require("../common/downloadAssets");
const helper_1 = require("../common/helper");
function genInjectPubspec() {
    const list = Object.keys(downloadAssets_1.FontList).filter((name) => name != 'inherit' && name);
    if (!list.length)
        return;
    const road = path_1.default.resolve(`./pubspec.yaml`);
    const pubStr = fs_1.default.readFileSync(road).toString();
    const beforeMark = '#### fonts inject start ####';
    const afterMark = '#### fonts inject end ####';
    const before = pubStr.split(beforeMark)[0];
    const after = pubStr.split(afterMark)[1];
    (0, helper_1.writeIn)(road, `${before}${beforeMark}
  fonts: ${list
        .map((name) => {
        return `
    - family: ${name}
      fonts:
        - asset: assets/${name}.ttf`;
    })
        .join('\n')}
${afterMark}${after}
`);
}
exports.genInjectPubspec = genInjectPubspec;
