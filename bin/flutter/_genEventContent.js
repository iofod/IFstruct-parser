"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genEventContent = void 0;
/* eslint-disable no-case-declarations */
/* eslint-disable prefer-const */
const helper_1 = require("../common/helper");
const _helper_1 = require("./_helper");
const _env_1 = require("./_env");
function getExec(fn, params, param, hid) {
    let fnexec = '';
    let fnargs = '';
    if (params)
        params.context = '__R__e.context__R__';
    if (params) {
        params.hid = hid;
    }
    const FX = _env_1.IF.ctx.Fx;
    const MF = _env_1.IF.ctx.MF;
    switch (fn) {
        case 'function':
            if (param && FX[param]) {
                const { key, dir = '' } = FX[param];
                const road = dir
                    ? dir
                        .substring(1)
                        .split('/')
                        .map((v) => `['${v}']`)
                        .join('')
                    : '';
                fnexec = `FX${road}['${key}']`;
                fnargs = `e.context`;
            }
            break;
        case 'service':
            if (param && MF[param]) {
                let { key, dir } = MF[param];
                if (!dir)
                    dir = '';
                const road = dir
                    ? dir
                        .substring(1)
                        .split('/')
                        .map((v) => `['${v}']`)
                        .join('')
                    : '';
                fnexec = `MF${road}['${key}']`;
                fnargs = `e.context`;
            }
            break;
        case 'getIndex':
            fnexec = `FA.getIndex`;
            fnargs = `e.context`;
            break;
        case 'alert':
            fnexec = `FA.${fn}`;
            fnargs = `parseModelExp('${param
                .replace(/\$/g, '\\$')
                .replace('\\$response', '$response')}', e.hid, false)`;
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
            const args = (0, _helper_1.expStringify)(params, hid);
            fnargs = `${args}`;
            break;
        case 'useInteractionFlow':
            if (params) {
                const { exp, map } = params;
                delete params.exp;
                delete params.map;
                const args = (0, _helper_1.expStringify)(params, hid);
                fnexec = `FA.${fn}`;
                fnargs = `{...${args}, "exp": (dx, dy, x, y, ds) => ${(0, _helper_1.genEvalStr)(exp)}${map ? `, "map": (RX) => ${map}` : ''}}`;
            }
            break;
        case 'useInterpolation':
            if (params) {
                const args = (0, _helper_1.expStringify)(params, hid);
                fnexec = `FA.${fn}`;
                fnargs = `${args}`;
            }
            break;
        case 'setCPA':
            if (params) {
                if (_helper_1.heroCP[hid]) {
                    if (!_helper_1.heroCP[hid].includes(params.tag)) {
                        _helper_1.heroCP[hid].push(params.tag);
                    }
                }
                else {
                    _helper_1.heroCP[hid] = [params.tag];
                }
                const args = (0, _helper_1.expStringify)(params, hid);
                fnexec = `FA.${fn}`;
                fnargs = `{...${args}, "clone": e.context.clone }`;
            }
            break;
        case 'setModel':
            if (params) {
                const copyParams = { ...params };
                const oldValue = copyParams.value;
                const flag = typeof oldValue == 'string' && oldValue;
                if (flag) {
                    copyParams.value = `__R__evalJS(||||${oldValue.replaceAll('$response', '${Executable(response)}')}||||)__R__`;
                }
                // params.value: replace  $ to /$
                let args = (0, _helper_1.expStringify)(copyParams, hid);
                if (flag) {
                    args = (0, _helper_1.genExp)(args, '${parseModelExp', '}');
                }
                fnexec = `FA.${fn}`;
                fnargs = `${args.replaceAll(`||||`, `'`)}`;
            }
            break;
        default:
            if (params) {
                const args = (0, _helper_1.expStringify)(params, hid);
                fnexec = `FA.${fn}`;
                fnargs = `${args}`;
            }
            break;
    }
    // The substitution of expressions is performed first.
    fnargs = fnargs.replace(/: "(.*?)\$response(.*?)"/g, ': $1response$2');
    // Global replacement of response in intermediate processes.
    fnargs = fnargs.replace(/"\$response"/g, 'response');
    return {
        fnexec,
        fnargs,
    };
}
let useCommand = false;
const useCommandList = [];
function genActionList(hid, actions, list = []) {
    const actionArr = actions.filter((action) => action.active);
    actionArr.forEach((action, I) => {
        const { fn, active, params, param } = action;
        if (!active)
            return;
        if (fn == 'assert') {
            let { exp, O, X } = action;
            exp = (0, _helper_1.genExp)(exp, '${parseModelExp', '}');
            const tmp = `
      if (${(0, _helper_1.genEvalStr)(exp)}) {
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
            exp = (0, _helper_1.genExp)(exp, '${parseModelExp', '}');
            useCommandList.push(useCommand);
            useCommand = true;
            const tmp = `
      var mark = await FA.whileAsync(() => (${(0, _helper_1.genEvalStr)(exp)}), (command) async {
        ${genActionList(hid, O, []).join('\n')}
      });

      if (mark == 'RETURN') return;
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
        return command('${param.toUpperCase()}');
        `;
            }
            else {
                tmp = `return '${param.toUpperCase()}';`;
            }
            list.push(tmp);
            return;
        }
        else {
            const { fnexec, fnargs } = getExec(fn, params, param, hid);
            if (!fnexec || !fnargs)
                return console.log('gen invalid: ', fn, params, param, hid);
            if (fn == 'getModel' || fn == 'getIndex') {
                let fragment = `await ` + fnexec + `(` + fnargs + `);`;
                const nextAction = actionArr[I + 1];
                // If the next action is function/service, you need to write e.context.
                if (nextAction) {
                    fragment = 'response = ' + fragment;
                    if (helper_1.writeResponseList.includes(nextAction.fn)) {
                        fragment += '\ne.context.response = response;';
                    }
                }
                list.push(fragment);
            }
            else if (helper_1.writeResponseList.includes(fn)) {
                let fragment = `await ` + fnexec + `(` + fnargs + `);`;
                const nextAction = actionArr[I + 1];
                if (nextAction &&
                    JSON.stringify(nextAction).includes('$response') &&
                    !helper_1.writeResponseList.includes(nextAction.fn)) {
                    fragment = 'response = ' + fragment;
                }
                list.push(fragment);
            }
            else {
                list.push(`await ` + fnexec + `(` + fnargs + `);`);
            }
        }
    });
    return list;
}
const customEvent = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CE_list = []; // Non-native events
function genEventContent(hid, events, _cloneMark, jumpCE = true) {
    const eventMethods = [];
    events.forEach((evo) => {
        if (jumpCE && customEvent.includes(evo.event)) {
            evo.hid = hid;
            CE_list.push(evo);
            return;
        }
        // If the evo carries an hid, it takes precedence, since the evo at this point originates from the CE_list.
        hid = evo.hid || hid;
        let { event, actions, mds } = evo;
        // Similar events are prioritized for conversion to native.
        switch (event) {
            case 'start':
                event = 'touchstart';
                break;
            case 'end':
                event = 'touchend';
                break;
            case 'modelchange':
                event += '_' + mds.substring(1);
                break;
            default:
                break;
        }
        const methodName = `${hid}$$${event}`;
        const execBody = genActionList(hid, actions);
        const acStr = JSON.stringify(actions);
        const use$Response = acStr.includes('$response') ||
            acStr.includes('function') ||
            acStr.includes('service') ||
            acStr.includes('${response}');
        const methodBody = `Future ${methodName}(e) async {
		${use$Response ? 'var response;\n' : ''}${execBody.join('\n')}
	}`;
        eventMethods.push(methodBody);
    });
    return {
        eventMethods,
    };
}
exports.genEventContent = genEventContent;
