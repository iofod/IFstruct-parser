const { format, writeIn } = require('../common/helper')
const { getPath } = require('./_helper')
const { IF } = require('./_env')

function genRouteContent(routes) {
  let main = IF.ctx.mainPage || 'index'
  let tree = IF.ctx.HSS[main]

  routes.push({
    dep: ``,
    ctx: `"/": (context, params) => PinitPage(title: '${tree.name}', root: P${main}(title: '${tree.name}', pid: '${main}', path: '/'))`,
  })

  return `import 'package:fluro/fluro.dart';
${routes.map((obj) => obj.dep).join('\n')}
import './common/vrouter.dart';
import './initPage.dart';

final routes = {
  ${routes.map((obj) => obj.ctx).join(',\n\t')}
};

final router = FluroRouter();
final $router = Router(router);

createRouter() {
  routes.forEach((path, route) {
    router.define(path, handler: Handler(handlerFunc: route));
  });
}`
}

function genRoutes() {
  let road = getPath('/router.dart')
  let content = genRouteContent(
    IF.ctx.pages.map((pid) => {
      let tree = IF.ctx.HSS[pid]

      return {
        dep: `import './pages/${pid}.dart';`,
        ctx: `"${pid}": (context, params) => P${pid}(title: '${tree.name}', pid: '${pid}', path: '${pid}')`,
      }
    })
  )

  writeIn(road, format(content, 'dart'))
}

exports.genRoutes = genRoutes
