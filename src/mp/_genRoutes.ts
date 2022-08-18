import { format, writeIn, getPath } from '../common/helper'
import { IF } from './_env'

function genRouteContent(routes) {
  return `
exports.router = [
	${routes.join(',\n\t\t')}
]`
}

function genRoutes() {
  const road = getPath('router.js')
  const content = genRouteContent(
    IF.ctx.pages.map((pid) => {
      return `'pages/${pid}/index'`
    })
  )

  writeIn(road, format(content, 'js'))
}

export { genRoutes }
