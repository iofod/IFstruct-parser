"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genRoutes = void 0;
const helper_1 = require("../common/helper");
const _helper_1 = require("./_helper");
const _env_1 = require("./_env");
function genRouteContent(routes) {
    const main = _env_1.IF.ctx.mainPage || 'index';
    const tree = _env_1.IF.ctx.HSS[main];
    routes.push({
        dep: ``,
        ctx: `"/": (context, params) => P${main}(title: '${tree.name}', pid: '${main}', path: '/')`,
    });
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
}`;
}
function genRoutes() {
    const road = (0, _helper_1.getPath)('/router.dart');
    const content = genRouteContent(_env_1.IF.ctx.pages.map((pid) => {
        const tree = _env_1.IF.ctx.HSS[pid];
        return {
            dep: `import './pages/${pid}.dart';`,
            ctx: `"${pid}": (context, params) => P${pid}(title: '${tree.name}', pid: '${pid}', path: '${pid}')`,
        };
    }));
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, 'dart'));
}
exports.genRoutes = genRoutes;
