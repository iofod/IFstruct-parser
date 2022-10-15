#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const mri_1 = __importDefault(require("mri"));
const Version = 'v1.3.0';
const FN_1 = require("./common/FN");
const create_1 = require("./create");
const sync_1 = require("./sync");
const auto_1 = require("./auto");
const argv = process.argv.slice(2);
const conf = (0, mri_1.default)(argv, {
    alias: {
        p: 'port',
        v: 'version',
        h: 'help',
        d: 'dir',
        t: 'temp',
    },
});
const sub = conf._;
const helpMsg = `usage: iofod [<command> [<args>]
Args:
  -v, --version                              Output the version number
  -h, --help                                 Output usage information
Command:
  create [dir] [temp]                        Create a new project based on the selected template
  listen [port] [temp]                       Add IFstruct change listeners to the created project
  auto                                       Set up an automated test server
  `;
function main() {
    if (!sub[0]) {
        if (conf.version)
            return (0, FN_1.msg)(Version);
        return (0, FN_1.log)(helpMsg);
    }
    if (typeof String.prototype.replaceAll != 'function')
        return (0, FN_1.error)('Your version of Node.js needs to be upgraded to v16.15.0 or above.');
    switch (sub[0]) {
        case 'create':
            (0, FN_1.log)(__dirname, path_1.default.resolve('./'));
            (0, create_1.create)(conf);
            break;
        case 'listen':
            (0, sync_1.sync)(conf);
            break;
        case 'auto':
            (0, auto_1.auto)(conf);
            break;
        default:
            (0, FN_1.log)(helpMsg);
            break;
    }
}
main();
