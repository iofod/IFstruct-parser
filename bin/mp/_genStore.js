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
    return `import { reactive } from 'vue'

export const store = reactive({
  app: {
    currentPage: '${mainPage}',
    lockScroll: false,
  },
  sets: ${str},
  history: {
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
})
`;
}
function genStore() {
    const road = (0, helper_1.getPath)('store/tree.ts');
    let subTree = (0, _helper_1.genetateSets)('Global');
    (0, _helper_1.genView)('Global');
    _env_1.IF.ctx.pages.forEach(async (pid) => {
        const tree = (0, _helper_1.genetateSets)(pid);
        subTree = {
            ...subTree,
            ...tree,
        };
    });
    const content = genStoreContent(subTree);
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, 'ts'));
}
exports.genStore = genStore;
