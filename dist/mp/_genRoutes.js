"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genRoutes = void 0;
const helper_1 = require("../common/helper");
const _env_1 = require("./_env");
function genRouteContent(routes) {
    return `
exports.router = [
	${routes.join(',\n\t\t')}
]`;
}
function genRoutes() {
    const road = (0, helper_1.getPath)('router.js');
    const content = genRouteContent(_env_1.IF.ctx.pages.map((pid) => {
        return `'pages/${pid}/index'`;
    }));
    (0, helper_1.writeIn)(road, (0, helper_1.format)(content, 'js'));
}
exports.genRoutes = genRoutes;
