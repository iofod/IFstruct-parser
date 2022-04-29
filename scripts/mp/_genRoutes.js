const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')

function genRouteContent(routes) {
	return `
exports.router = [
	${routes.join(',\n\t\t')}
]`
}

function genRoutes() {
  let road = getPath('router.js')

  let content = genRouteContent(IF.ctx.pages.map(pid => {
    return `'pages/${pid}/index'`
  }))

  writeIn(road, format(content, 'js'))
}

exports.genRoutes = genRoutes