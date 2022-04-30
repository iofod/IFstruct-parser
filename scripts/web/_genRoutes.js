const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')

function genRouteContent(routes) {
  return `
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
		${routes.join(',\n\t\t')},
    { path: '/', redirect: '/${IF.ctx.mainPage}' }
  ]
})`
}

function genRoutes() {
  let road = getPath('router/index.js')

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

  writeIn(road, format(content, 'js'))
}

exports.genRoutes = genRoutes
