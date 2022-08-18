import { format, writeIn } from '../common/helper'
import { getPath } from './_helper'
import { IF } from './_env'

function genRouteContent(routes) {
  const main = IF.ctx.mainPage || 'index'
  const tree = IF.ctx.HSS[main]

  routes.push({
    dep: ``,
    ctx: `"/": (context, params) => P${main}(title: '${tree.name}', pid: '${main}', path: '/')`,
  })

  return `import 'package:fluro/fluro.dart';
${routes.map((obj) => obj.dep).join('\n')}
import './common/vrouter.dart';

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
  const road = getPath('/router.dart')
  const content = genRouteContent(
    IF.ctx.pages.map((pid) => {
      const tree = IF.ctx.HSS[pid]

      return {
        dep: `import './pages/${pid}.dart';`,
        ctx: `"${pid}": (context, params) => P${pid}(title: '${tree.name}', pid: '${pid}', path: '${pid}')`,
      }
    })
  )

  writeIn(road, format(content, 'dart'))
}

export { genRoutes }
