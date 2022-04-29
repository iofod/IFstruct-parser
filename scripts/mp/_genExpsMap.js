const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')
const InnerExp = ['$N', '$odd', '$even']

function parseComputedExp(exp) {
	if (typeof exp == 'string' && exp.indexOf('# ') == 0) {
		let expList = exp.match(/\$\w+(-\w+)?(<.+?>)?/g) || []

		expList.forEach((mds) => {
			exp = exp.replace(new RegExp('\\' + mds, 'gm'), `FN.parseModelStr('${mds}', hid)`)
		})

		return `__R__(hid) => ${exp.substr(2)}__R__`
	}
}

function genExpsMapContent() {
	let expsMap = {}
	let computedMap = {}
  let HSS = IF.ctx.HSS

	for (let hid in HSS) {
		let target = HSS[hid]

		target.status.forEach(statu => {
			let { name, id, props } = statu
			let { customKeys = {} } = props.option

			for (let ck in customKeys) {
				let cexp = customKeys[ck]
				let cstr = parseComputedExp(cexp)

				if (cstr) {
					computedMap[cexp] = cstr
				}
			}

			if (!name.includes('$')) return

			let nameArr = name.split(':')

			// Proceed to the next step only if a subexpression exists.
			if (nameArr.length < 2) return

			nameArr.slice(1).forEach(exp => {
				let originExp = exp
				//1. Skip independent expressions.
				if (InnerExp.includes(exp)) return
				//2. Substitution of numbers.
				let nreg = exp.match(/\$\d+/g)
				if (nreg) {
					nreg.forEach(md => {
						exp = exp.replace(md, md.substr(1))
					})
				}
				//4. Replaces the model variable expressions.
				let expList = exp.match(/\$([_a-zA-Z]\w+)<*(\w*)>*/g) || []
				expList.forEach((mds) => {
					exp = exp.replace(new RegExp('\\' + mds, 'gm'), `FN.parseModelStr('${mds}', hid)`)
				})

				//3. Replace built-in expressions.
				exp = exp.replace(/(\w+)?\$i(?=\W)/g, '$1_i').replace(/\$i$/, '_i')
				exp = exp.replace(/(\w+)?\$n(?=\W)/g, '$1_n').replace(/\$n$/, '_n')

				expsMap[originExp] = `__R__(_i, _n, hid) => ${exp}__R__`
			})
		})

		let models = target.model

		for (let mk in models) {
			let mexp = models[mk].value
			let mstr = parseComputedExp(mexp)

			if (mstr) {
				computedMap[mexp] = mstr
			}
		}
	}

	return `import FN from './FN'
export default ${JSON.stringify({
	...expsMap,
	...computedMap
}, null, 2).replaceAll('"__R__', '').replaceAll('__R__"', '')}
`
}

//The mini-app does not support eval, so static state expressions are used here.
function genExpsMap() {
  let road = getPath('common/ExpsMap.js')
  let content = genExpsMapContent()

  writeIn(road, format(content, 'js'))
}

exports.genExpsMap = genExpsMap