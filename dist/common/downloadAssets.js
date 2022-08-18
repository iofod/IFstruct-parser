"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadExternals = exports.downloadEntrys = exports.localizExternals = exports.parserExternal = exports.localizModules = exports.setIFTarget = exports.externalList = exports.entryList = exports.FontCDN = exports.FontList = exports.downloadFonts = exports.downloadAssets = exports.localizModel = exports.localizImage = void 0;
/* eslint-disable no-async-promise-executor */
const fs_1 = __importDefault(require("fs"));
const download_1 = __importDefault(require("download"));
const helper_1 = require("./helper");
const reg_filename = /(.*\/)*(.+)/;
const REGEXP_URL = /^([a-z][a-z\d+\-.]*:)?\/\//i;
const assetsPath = './assets/';
const FontCDN = 'https://static.iofod.com/';
exports.FontCDN = FontCDN;
const assetsList = [];
const FontList = {};
exports.FontList = FontList;
const entryList = [];
exports.entryList = entryList;
const externalList = [];
exports.externalList = externalList;
let IFtarget = 'web';
function getFileName(url) {
    let str = url.split('?')[0];
    if (!str)
        return '';
    str = str.match(reg_filename)[2];
    if (IFtarget == 'web') {
        return str.replaceAll(' ', '_').replaceAll('%20', '_'); // replace %20 to _
    }
    return str.replaceAll(' ', '%20');
}
function localizImage(obj, usePath = true) {
    const bgi = obj['backgroundImage'];
    if (bgi && bgi.startsWith('url(')) {
        let url = '';
        const selected = bgi.match(/url\((.+)\)/);
        if (selected) {
            url = selected[1].replace(/"/g, '');
        }
        if (!url.startsWith(assetsPath)) {
            if (REGEXP_URL.test(url)) {
                assetsList.push(url);
                const filename = getFileName(url);
                const newUrl = usePath ? assetsPath + filename : filename;
                obj['backgroundImage'] = `url(${newUrl})`;
            }
        }
    }
}
exports.localizImage = localizImage;
function traverseArray(arr, callback) {
    arr.forEach((item, index) => {
        if (Array.isArray(item)) {
            traverseArray(item, callback);
        }
        else {
            callback(arr, index);
        }
    });
}
function localizModel(obj, usePath = true) {
    if (obj.url) {
        const { value } = obj.url;
        if (!value)
            return;
        if (Array.isArray(value)) {
            assetsList.push(...value
                .toString()
                .split(',')
                .filter((v) => REGEXP_URL.test(v)));
            traverseArray(value, (arr, index) => {
                let src;
                if (REGEXP_URL.test(arr[index])) {
                    try {
                        const filename = getFileName(arr[index]);
                        src = usePath ? assetsPath + filename : filename;
                    }
                    catch (error) {
                        console.log(error);
                        src = '';
                    }
                    arr[index] = src;
                }
            });
        }
        else {
            if (REGEXP_URL.test(value)) {
                assetsList.push(value);
                try {
                    const filename = getFileName(value);
                    obj.url.value = usePath ? assetsPath + filename : filename;
                }
                catch (e) {
                    console.log(value, reg_filename, e);
                }
            }
        }
    }
}
exports.localizModel = localizModel;
function parserExternal(str) {
    const url = new URL(str);
    const dir = url.hostname;
    const portStr = url.port ? url.port + '.' : '';
    const filename = portStr +
        url.pathname
            .split('/')
            .filter((e) => e)
            .join('.');
    return {
        url: str,
        dir,
        filename,
    };
}
exports.parserExternal = parserExternal;
function localizExternals(externals) {
    const obj = {};
    for (const key in externals) {
        const exObj = parserExternal(externals[key]);
        externalList.push(exObj);
        obj[key] = exObj.filename;
    }
    return obj;
}
exports.localizExternals = localizExternals;
function localizModules(obj) {
    if (!obj.entry)
        return;
    const { value } = obj.entry;
    if (!value)
        return;
    if (Array.isArray(value)) {
        entryList.push(...value
            .toString()
            .split(',')
            .filter((v) => REGEXP_URL.test(v))
            .map((v) => parserExternal(v)));
        traverseArray(value, (arr, index) => {
            if (REGEXP_URL.test(arr[index])) {
                arr[index] = parserExternal(arr[index]).filename;
            }
        });
    }
    else {
        if (REGEXP_URL.test(value)) {
            const exObj = parserExternal(value);
            entryList.push(exObj);
            obj.entry.value = exObj.filename;
        }
    }
}
exports.localizModules = localizModules;
function downloadAssets(getAssetsPath) {
    return Promise.all([...new Set(assetsList)]
        .filter((e) => e)
        .map((url) => {
        return new Promise(async (done) => {
            const filename = getFileName(url);
            const road = getAssetsPath(filename);
            if (fs_1.default.existsSync(road) || !REGEXP_URL.test(url))
                return done(true);
            console.log('Download...', url);
            // Save locally
            try {
                fs_1.default.writeFileSync(road, await (0, download_1.default)(url));
            }
            catch (e) {
                console.error(e);
            }
            done(true);
        });
    }));
}
exports.downloadAssets = downloadAssets;
function downloadFonts(getAssetsPath, type = 'ttf') {
    return Promise.all(Object.keys(FontList)
        .filter((e) => e)
        .filter((name) => name != 'inherit' && name)
        .map((name) => {
        return new Promise(async (done) => {
            const road = getAssetsPath(name + '.' + type);
            if (fs_1.default.existsSync(road))
                return done(true);
            console.log('Download...', name);
            const url = `${FontCDN}fonts/${name}.${type}`;
            try {
                await (0, download_1.default)(url, getAssetsPath(''));
            }
            catch (e) {
                console.error(e);
            }
            done(true);
        });
    }));
}
exports.downloadFonts = downloadFonts;
function downloadEntrys(getEntrysPath) {
    return Promise.all(entryList.map((obj) => {
        const { dir, filename, url } = obj;
        return new Promise(async (done) => {
            const road = getEntrysPath(dir + '/' + filename);
            if (fs_1.default.existsSync(road))
                return done(true);
            console.log('Download Entrys...', url);
            await (0, helper_1.mkdir)(`externals/${dir}`);
            // Save locally
            try {
                fs_1.default.writeFileSync(road, await (0, download_1.default)(url));
            }
            catch (e) {
                console.error(e);
            }
            done(true);
        });
    }));
}
exports.downloadEntrys = downloadEntrys;
function downloadExternals(getExternalsPath) {
    return Promise.all(externalList.map((obj) => {
        const { dir, filename, url } = obj;
        return new Promise(async (done) => {
            const road = getExternalsPath(dir + '/' + filename);
            if (fs_1.default.existsSync(road))
                return done(true);
            console.log('Download Externals...', url);
            await (0, helper_1.mkdir)(getExternalsPath(dir), false);
            // Save locally
            try {
                fs_1.default.writeFileSync(road, await (0, download_1.default)(url));
            }
            catch (e) {
                console.error(e);
            }
            done(true);
        });
    }));
}
exports.downloadExternals = downloadExternals;
function setIFTarget(type) {
    IFtarget = type;
}
exports.setIFTarget = setIFTarget;
