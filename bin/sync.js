"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sync = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ws_1 = __importDefault(require("ws"));
const get_port_1 = __importDefault(require("get-port"));
const rfc6902_1 = require("rfc6902");
const FN_1 = require("./common/FN");
let initData;
let port;
let data;
let projectType;
let selected;
function renderView(cache = true, useRemote = false) {
    initData(JSON.parse(JSON.stringify(data)), {
        cache,
        projectType,
        selected,
        useRemote,
    }).then((res) => {
        (0, FN_1.log)(res);
        console.log('Listen port:', port);
    });
}
function isExist(name) {
    return fs_1.default.existsSync(path_1.default.resolve(`./${name}`));
}
const TempsMap = {
    web: () => require('./web/gen_web').initData,
    pcweb: () => require('./web/gen_web').initData,
    mp: () => require('./mp/gen_mp').initData,
    flutter: () => require('./flutter/gen_flutter').initData,
};
async function main(conf) {
    const { useRemote } = conf; //web support useRemote params
    if (isExist(`pubspec.yaml`)) {
        projectType = selected = 'flutter';
        initData = TempsMap.flutter();
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
            selected = json.template;
        }
        if (json.template.includes('Taro')) {
            projectType = selected = 'mp';
        }
    }
    else {
        return (0, FN_1.error)('The current project type cannot be recognized');
    }
    initData = TempsMap[projectType]();
    port = conf.port || (await (0, get_port_1.default)());
    console.log('Listen port:', port);
    const wss = new ws_1.default.Server({ port });
    wss.on('connection', function connection(client, req) {
        // console.log('context>>', req)
        // console.log('context>>', JSON.stringify(context))
        const { headers } = req;
        const cid = headers['sec-websocket-key'];
        client.cid = cid;
        client.on('message', function incoming(message) {
            try {
                const obj = JSON.parse(message);
                if (obj.type == 'ALL') {
                    data = obj.payload;
                    renderView(false, useRemote);
                }
                if (obj.type == 'OT') {
                    const ot = obj.payload;
                    (0, FN_1.log)(ot);
                    (0, rfc6902_1.applyPatch)(data, ot);
                    renderView(true, useRemote);
                }
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
exports.sync = main;
