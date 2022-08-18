"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genRoutes = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
function genRouteContent(routes) {
    switch (_env_1.IF.framework) {
        case 'Vue2':
            return `import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
		${routes.join(',\n\t\t')},
    { path: '/', redirect: '/${_env_1.IF.ctx.mainPage}' }
  ]
})`;
        case 'Vue3':
            return `import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
		${routes.join(',\n\t\t')},
    { path: '/', redirect: '/${_env_1.IF.ctx.mainPage}' }
  ]
})`;
        default:
            break;
    }
    return '';
}
function genRoutes() {
    const useTs = _env_1.IF.framework == 'Vue3';
    const mark = useTs ? 'ts' : 'js';
    const road = (0, helper_1.getPath)('router/index.' + mark);
    const content = genRouteContent(_env_1.IF.ctx.pages.map((pid) => {
        const tree = _env_1.IF.ctx.HSS[pid];
        return `{
      path: '/${tree.historyPath || pid}',
      name: '${tree.name}',
      meta: { title: '${tree.name}', pid: '${pid}' },
      component: () => import('../pages/${pid}.vue')
    }`;
    }));
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, mark));
}
exports.genRoutes = genRoutes;
