"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genActionList = void 0;
/* eslint-disable no-case-declarations */
/* eslint-disable prefer-const */
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
let useCommand = false;
const useCommandList = [];
function expStringify(params, hid, jumpKeys = []) {
    for (const attr in params) {
        const value = params[attr];
        if (!jumpKeys.includes(attr) &&
            typeof value == 'string' &&
            value != '$current' &&
            value.slice(0, 1) === '$' &&
            helper_1.parseExclude.filter((v) => value.includes(v)).length < 1) {
            params[attr] = `__R__FN.parseModelStr('${value}', e.hid)__R__`;
        }
    }
    return (0, helper_1.processReplacement)(JSON.stringify(params, null, 2), hid);
}
function getExec(fn, params, param, hid) {
    let fnexec = '';
    let fnargs = '';
    if (params) {
        params.hid = hid;
    }
    switch (fn) {
        case 'function':
            if (param && _env_1.IF.ctx.Fx[param]) {
                const { key, dir = '' } = _env_1.IF.ctx.Fx[param];
                const road = dir.split('/').join('.');
                fnexec = `FX${road}.${key}`;
                fnargs = `e.context`;
            }
            break;
        case 'service':
            if (param && _env_1.IF.ctx.MF[param]) {
                let { key, dir } = _env_1.IF.ctx.MF[param];
                if (!dir) {
                    dir = '';
                }
                const road = dir.split('/').join('.');
                fnexec = `MF${road}.${key}`;
                fnargs = `e.context`;
            }
            break;
        case 'getIndex':
            fnexec = `FA.getIndex`;
            fnargs = `e.context`;
            break;
        case 'alert':
            fnexec = `FA.${fn}`;
            fnargs = `FN.parseModelExp("${param}", e.hid, false)`;
            break;
        case 'routerGo':
        case 'timeout':
            fnexec = `FA.${fn}`;
            fnargs = `${param}`;
            break;
        case 'animate':
            fnexec = `FA.animate`;
            const curr = _env_1.IF.ctx.HSS[hid];
            let currState = _env_1.IF.ctx.getActiveMetaState(hid);
            params.frames = params.frames.map((id) => {
                const state = curr.status.filter((statu) => statu.id === id)[0];
                const changed = (0, helper_1.diffState)(currState, state);
                currState = state;
                return changed;
            });
            const args = expStringify(params, hid);
            fnargs = `${args}`;
            break;
        case 'useInteractionFlow':
        case 'useInterpolation':
            if (params) {
                const args = expStringify(params, hid, ['exp']);
                fnexec = `FA.${fn}`;
                fnargs = `${args}`;
            }
            break;
        case 'setCPA':
            if (params) {
                const args = expStringify(params, hid);
                fnexec = `FA.${fn}`;
                fnargs = `{...${args}, clone: e.context.clone }`;
            }
            break;
        default:
            if (params) {
                const args = expStringify(params, hid);
                fnexec = `FA.${fn}`;
                fnargs = `${args}`;
            }
            break;
    }
    // The substitution of expressions is performed first.
    fnargs = fnargs.replace(/: "(.*?)\$response(.*?)"/g, ': $1response$2');
    // Global replacement of response in intermediate processes.
    fnargs = fnargs.replace(/"\$response"/g, 'response');
    if (fn == 'setModel') {
        fnargs = (0, helper_1.genExp)(fnargs);
    }
    return {
        fnexec,
        fnargs,
    };
}
function genActionList(hid, actions, list = []) {
    const actionArr = actions.filter((action) => action.active);
    actionArr.forEach((action, I) => {
        const { fn, active, params, param } = action;
        if (!active)
            return;
        if (fn == 'assert') {
            let { exp, O, X } = action;
            exp = (0, helper_1.genExp)(exp);
            const tmp = `
      if (${exp}) {
        ${genActionList(hid, O, []).join('\n')}
      } else {
        ${genActionList(hid, X, []).join('\n')}
      }
      `;
            list.push(tmp);
        }
        else if (fn == 'loopAssert') {
            // while
            let { exp, O } = action;
            exp = (0, helper_1.genExp)(exp);
            useCommandList.push(useCommand);
            useCommand = true;
            const tmp = `
      let mark = await FA.whileAsync(() => (${exp}), async(command) => {
        ${genActionList(hid, O, []).join('\n')}
      })

      if (mark == 'RETURN') return
      `;
            list.push(tmp);
            useCommand = useCommandList.pop() || false;
        }
        else if (fn == 'applyActions') {
            let { target, fromEvent } = action.params;
            target = target == '$current' ? hid : target;
            const origin = _env_1.IF.ctx.HSS[target];
            if (!origin)
                return console.warn('applyActions fail:', target, fromEvent);
            const event = origin.events.filter((ev) => ev.event == fromEvent)[0] || {};
            const quote = event.actions || [];
            const tmp = `${genActionList(hid, quote, []).join('\n')}`;
            list.push(tmp);
        }
        else if (fn == 'ended') {
            // break|continue|return
            let tmp;
            if (useCommand) {
                tmp = `
        return command('${param.toUpperCase()}')
        `;
            }
            else {
                tmp = `return '${param.toUpperCase()}'`;
            }
            list.push(tmp);
            return;
        }
        else {
            const { fnexec, fnargs } = getExec(fn, params, param, hid);
            if (!fnexec || !fnargs)
                return console.log('gen invalid: ', fn, params, param, hid);
            if (fn == 'getModel' || fn == 'getIndex') {
                let fragment = `await ` + fnexec + `(` + fnargs + `)`;
                const nextAction = actionArr[I + 1];
                // If the next action is function/service, you need to write e.context.
                if (nextAction) {
                    fragment = 'response = ' + fragment;
                    if (helper_1.writeResponseList.includes(nextAction.fn)) {
                        fragment += '\ne.context.response = response';
                    }
                }
                list.push(fragment);
            }
            else if (helper_1.writeResponseList.includes(fn)) {
                let fragment = `await ` + fnexec + `(` + fnargs + `)`;
                const nextAction = actionArr[I + 1];
                if (nextAction &&
                    JSON.stringify(nextAction).includes('$response') &&
                    !helper_1.writeResponseList.includes(nextAction.fn)) {
                    fragment = 'response = ' + fragment;
                }
                list.push(fragment);
            }
            else {
                list.push(`await ` + fnexec + `(` + fnargs + `)`);
            }
        }
    });
    return list;
}
exports.genActionList = genActionList;
