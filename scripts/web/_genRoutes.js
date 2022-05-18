const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')


function genRouteContent(routes) {
  switch (IF.framework) {
    case 'Vue2':
      return `import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
		${routes.join(',\n\t\t')},
    { path: '/', redirect: '/${IF.ctx.mainPage}' }
  ]
})`
    
    case 'Vue3':
      return `import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
		${routes.join(',\n\t\t')},
    { path: '/', redirect: '/${IF.ctx.mainPage}' }
  ]
})`
    default:
      break;
  }
}

function genRoutes() {
  let useTs = IF.framework == 'Vue3'
  let mark = useTs ? 'ts' : 'js'
  let road = getPath('router/index.' + mark)
  let content = genRouteContent(
    IF.ctx.pages.map((pid) => {
      let tree = IF.ctx.HSS[pid]

      return `{
      path: '/${tree.historyPath || pid}',
      name: '${tree.name}',
      meta: { title: '${tree.name}', pid: '${pid}' },
      component: () => import('../pages/${pid}.vue')
    }`
    })
  )

  writeIn(road, format(content, mark))
}

exports.genRoutes = genRoutes
