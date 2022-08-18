"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.msg = exports.error = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const chalk_1 = __importDefault(require("chalk"));
const log = console.log;
exports.log = log;
const error = (...v) => log(chalk_1.default.red(`${v}`));
exports.error = error;
const msg = (...v) => log(chalk_1.default.cyan(`${v}`));
exports.msg = msg;
