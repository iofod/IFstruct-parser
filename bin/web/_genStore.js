"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genStore = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
const _helper_1 = require("./_helper");
function genStoreContent(tree) {
    const str = JSON.stringify(Object.assign({
        padding: {
            status: [
                {
                    name: 'default',
                    id: 'default',
                    style: [],
                    custom: {},
                    active: true,
                },
            ],
            model: {},
        },
    }, tree), null, 2)
        .split('\n')
        .join('\n');
    const model = {};
    const TB = _env_1.IF.ctx.table;
    for (const mid in TB) {
        const obj = TB[mid];
        model[obj.key] = {
            id: mid,
            subscriber: obj.subscriber,
        };
    }
    const mstr = JSON.stringify(model, null, 2);
    const config = {};
    _env_1.IF.ctx.pages.forEach((pid) => {
        const tags = {};
        let hasTag = false;
        (0, _helper_1.traveSets)(pid, (hid, target) => {
            const tag = target.model.tag;
            if (tag) {
                hasTag = true;
                const vid = tag.value;
                if (vid)
                    tags[vid] = hid;
            }
        });
        if (hasTag)
            config[pid] = tags;
    });
    const cfstr = JSON.stringify(config, null, 2);
    const mainPage = _env_1.IF.ctx.mainPage;
    const commonStr = `history: {
    past: [],
    current: {
      target: '${mainPage}',
      during: 500,
      transition: 'fade',
      timestamp: 0
    },
    future: [],
    heroTagsMap: ${cfstr},
    currentTags: {},
    returnTags: {},
    useRunCases: false,
    previewEventMap: {},
    interactionRecord: {},
    previewCursor: {
      x: -20,
      y: -20,
      useTransition: true
    },
  },
  models: ${mstr}
  `;
    switch (_env_1.IF.framework) {
        case 'Vue2':
            return `export default {
  state: {
    app: {
      currentPage: '${mainPage}',
    },
    sets: ${str},
    ${commonStr}
  },
}`;
        case 'Vue3':
            return `import { reactive } from 'vue'

export const store = reactive({
  app: {
    currentPage: '${mainPage}',
  },
  sets: ${str},
  ${commonStr}
})`;
        default:
            break;
    }
    return '';
}
function genStore() {
    const useTs = _env_1.IF.framework == 'Vue3';
    const mark = useTs ? 'ts' : 'js';
    const road = (0, helper_1.getPath)('store/tree.' + mark);
    const subTree = (0, _helper_1.genetateSets)('Global');
    (0, _helper_1.genView)('Global');
    const content = genStoreContent(subTree);
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, mark));
}
exports.genStore = genStore;
