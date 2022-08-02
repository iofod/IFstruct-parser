const { format, writeIn, getPath } = require('../common/helper')
const { IF } = require('./_env')
const InnerExp = ['$N', '$odd', '$even']
const RegModelVar = /\$([_a-zA-Z]\w+)(<\w*>)?/g

function parseComputedExp(exp) {
  if (typeof exp == 'string' && exp.indexOf('# ') == 0) {
    let expList = exp.match(RegModelVar) || []

    expList.forEach((mds) => {
      exp = exp.replaceAll(mds, `FN.parseModelStr('${mds}', hid)`)
    })

    return `__R__(hid) => ${exp.substring(2)}__R__`
  }
}

function genExpsMapContent() {
  let expsMap = {}
  let computedMap = {}
  let HSS = IF.ctx.HSS

  for (let hid in HSS) {
    let target = HSS[hid]

    target.status.forEach((statu) => {
      let { name, id, props } = statu
      let { customKeys = {} } = props.option

      for (let ck in customKeys) {
        let cexp = customKeys[ck]
        let cstr = parseComputedExp(cexp)

        if (cstr) {
          computedMap[cexp] = cstr
        }
      }

      // if (!name.includes('$')) return //=>  default:true is allowed

      let nameArr = name.split(':')

      // Proceed to the next step only if a subexpression exists.
      if (nameArr.length < 2) return

      nameArr.slice(1).forEach((exp) => {
        let originExp = exp
        //1. Skip independent expressions.
        if (InnerExp.includes(exp)) return
        //2. Substitution of numbers.
        let nreg = exp.match(/\$\d+/g)
        if (nreg) {
          nreg.forEach((md) => {
            exp = exp.replace(md, md.substring(1))
          })
        }
        //4. Replaces the model variable expressions.
        let expList = exp.match(RegModelVar) || []

        ;([...new Set(expList)]).forEach((mds) => {
          exp = exp.replaceAll(mds, `FN.parseModelStr('${mds}', hid)`)
        })

        //3. Replace built-in expressions.
        exp = exp.replaceAll('$i', '_i').replaceAll('$n', '_n')

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
export default ${JSON.stringify(
    {
      ...expsMap,
      ...computedMap,
    },
    null,
    2
  )
    .replaceAll('"__R__', '')
    .replaceAll('__R__"', '')}
`
}

//The mini-app does not support eval, so static state expressions are used here.
function genExpsMap() {
  let road = getPath('common/ExpsMap.ts')
  let content = genExpsMapContent()

  writeIn(road, format(content, 'ts'))
}

exports.genExpsMap = genExpsMap
