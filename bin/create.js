"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
/* eslint-disable prefer-const */
const fs_extra_1 = __importDefault(require("fs-extra"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const FN_1 = require("./common/FN");
const Temps = [
    {
        name: 'web',
        description: 'Web - Create a Mobile Web project',
    },
    {
        name: 'pcweb',
        description: 'PC Web - Create a PC Web project',
    },
    {
        name: 'mp',
        description: 'Taro - Create a Mini Program project',
    },
    {
        name: 'flutter',
        description: 'Flutter - Create a Flutter project',
    },
    {
        name: 'extension',
        description: 'Extension - Create a iofod extension',
    },
];
const SubTemps = {
    web() {
        return [
            {
                name: 'Web-Vue2',
                description: 'Vue2 - Mobile Web project based on the Vue2',
            },
            {
                name: 'Web-Vue3',
                description: 'Vue3 - Mobile Web project based on the Vue3',
            },
        ];
    },
    pcweb() {
        return [
            {
                name: 'Web-Vue2',
                description: 'Vue2 - PC Web project based on the Vue2',
            },
            {
                name: 'Web-Vue3',
                description: 'Vue3 - PC Web project based on the Vue3',
            },
        ];
    },
    mp() {
        return [];
    },
    flutter() {
        return [];
    },
    extension() {
        return [];
    },
};
let projectType;
let selected;
const replaceTempMap = {
    '_gitignore': '.gitignore'
};
function replaceTemp(road) {
    let p = fs_1.default.readdirSync(road);
    p.forEach(function (r) {
        if (fs_1.default.statSync(road + '/' + r).isDirectory()) {
            replaceTemp(road + '/' + r);
        }
        else {
            for (let name in replaceTempMap) {
                if (r == name) {
                    fs_1.default.renameSync(road + '/' + r, road + '/' + replaceTempMap[name]);
                }
            }
        }
    });
}
// Copy project templates according to user configuration.
async function main(conf) {
    let { temp, dir } = conf;
    if (temp) {
        if (!Temps.map((o) => o.name).includes(temp)) {
            return (0, FN_1.error)(`${temp} invalid`);
        }
        selected = projectType = temp;
    }
    else {
        const input = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'temp',
                message: 'Please choose a template',
                default: Temps[0].name,
                choices: Temps.map((obj) => {
                    return {
                        name: obj.description,
                        value: obj.name,
                    };
                }),
            },
        ]);
        selected = projectType = input.temp;
    }
    if (projectType == 'pcweb' || projectType == 'web') {
        const branch = SubTemps[projectType]();
        const input = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'temp',
                message: 'Please select the project framework',
                default: branch[0].name,
                choices: branch.map((obj) => {
                    return {
                        name: obj.description,
                        value: obj.name,
                    };
                }),
            },
        ]);
        selected = input.temp;
    }
    if (!dir) {
        const output = await inquirer_1.default.prompt([
            {
                type: 'input',
                message: 'Project name?',
                name: 'name',
                default: 'gen-' + projectType,
                validate: function (val) {
                    if (!/^[\w\-. ]+$/.test(val))
                        return 'Invalid project name';
                    return true;
                },
            },
        ]);
        dir = output.name;
    }
    fs_extra_1.default.copySync(path_1.default.resolve(__dirname, `../temps/${selected}`), `./${dir}`, {
        overwrite: true,
    });
    // pcweb is a branch of the web template, copy the web template first, then overwrite it with the pcweb file.
    if (projectType == 'pcweb') {
        fs_extra_1.default.copySync(path_1.default.resolve(__dirname, `../temps/PC${selected}`), `./${dir}`, {
            overwrite: true,
        });
    }
    replaceTemp(`./${dir}`);
    return (0, FN_1.msg)(`Done!`);
}
exports.create = main;
