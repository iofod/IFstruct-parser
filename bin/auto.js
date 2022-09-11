"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auto = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ws_1 = __importDefault(require("ws"));
const FN_1 = require("./common/FN");
let projectType;
let port;
const autoPortMap = {
    'web': 5210,
    'pcweb': 5210,
    'mp': 5211,
    'flutter': 5212
};
function isExist(name) {
    return fs_1.default.existsSync(path_1.default.resolve(`./${name}`));
}
async function main(conf) {
    if (isExist(`pubspec.yaml`)) {
        projectType = 'flutter';
    }
    else if (isExist('package.json')) {
        const json = require(path_1.default.resolve(`./package.json`));
        if (!json.template)
            return (0, FN_1.error)('The current project is not a valid iofod project');
        if (json.template.includes('Web')) {
            if (json.template.includes('PC')) {
                projectType = 'pcweb';
            }
            else {
                projectType = 'web';
            }
        }
        if (json.template.includes('Taro')) {
            projectType = 'mp';
        }
    }
    else {
        return (0, FN_1.error)('The current project type cannot be recognized');
    }
    port = conf.port || autoPortMap[projectType];
    console.log('Listen port:', port);
    const wss = new ws_1.default.Server({ port });
    wss.on('connection', function connection(client, req) {
        const { headers } = req;
        const cid = headers['sec-websocket-key'];
        client.cid = cid;
        client.on('message', function incoming(message) {
            try {
                const obj = JSON.parse(message);
                if (obj.type == 'INIT_AUTO') {
                    client.isEditor = true;
                }
                if (obj.type == 'START_AUTO') {
                    const receivers = Array.from(wss.clients).filter((c) => c.isEditor != true);
                    if (!receivers.length)
                        return;
                    receivers.forEach(receiver => {
                        receiver.send(JSON.stringify({
                            type: 'START_AUTO',
                            payload: obj.payload
                        }));
                    });
                }
                if (obj.type == 'CALLBACK') {
                    const editor = Array.from(wss.clients).filter((c) => c.isEditor == true)[0];
                    if (!editor)
                        return;
                    editor.send(JSON.stringify({
                        type: 'CALLBACK',
                        payload: obj.payload
                    }));
                }
            }
            catch (e) {
                console.error(e);
            }
        });
    });
    wss.on('error', (e) => {
        console.error(e);
    });
}
exports.auto = main;
