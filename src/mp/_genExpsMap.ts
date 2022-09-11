import { format, writeIn, getPath } from '../common/helper'
import { IF } from './_env'
const InnerExp = ['$N', '$odd', '$even']
const RegModelVar = /\$([_a-zA-Z]\w+)(<\w*>)?/g

function parseComputedExp(exp) {
  if (typeof exp == 'string' && exp.indexOf('# ') == 0) {
    const expList = exp.match(RegModelVar) || []

    expList.forEach((mds) => {
      exp = exp.replaceAll(mds, `FN.parseModelStr('${mds}', hid)`)
    })

    return `__R__(hid) => ${exp.substring(2)}__R__`
  }

  return ''
}

function genExpsMapContent() {
  const expsMap = {}
  const computedMap = {}
  const HSS = IF.ctx.HSS

  for (const hid in HSS) {
    const target = HSS[hid]

    target.status.forEach((statu) => {
      const { name, props } = statu
      const { customKeys = {} } = props.option

      for (const ck in customKeys) {
        const cexp = customKeys[ck]
        const cstr = parseComputedExp(cexp)

        if (cstr) {
          computedMap[cexp] = cstr
        }
      }

      // if (!name.includes('$')) return //=>  default:true is allowed
      if (!name.includes('$') && !name.includes(':')) return

      const nameArr = name.split(':')

      // Proceed to the next step only if a subexpression exists.
      if (nameArr.length < 2) return

      nameArr.slice(1).forEach((exp) => {
        const originExp = exp
        //1. Skip independent expressions.
        if (InnerExp.includes(exp)) return
        //2. Substitution of numbers.
        const nreg = exp.match(/\$\d+/g)
        if (nreg) {
          nreg.forEach((md) => {
            exp = exp.replace(md, md.substring(1))
          })
        }
        //4. Replaces the model variable expressions.
        const expList = exp.match(RegModelVar) || []

        ;[...new Set(expList)].forEach((mds) => {
          exp = exp.replaceAll(mds, `FN.parseModelStr('${mds}', hid)`)
        })

        //3. Replace built-in expressions.
        exp = exp.replaceAll('$i', '_i').replaceAll('$n', '_n')

        expsMap[originExp] = `__R__(_i, _n, hid) => ${exp}__R__`
      })
    })

    const models = target.model

    for (const mk in models) {
      const mexp = models[mk].value
      const mstr = parseComputedExp(mexp)

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
  const road = getPath('common/ExpsMap.ts')
  const content = genExpsMapContent()

  writeIn(road, format(content, 'ts'))
}

export { genExpsMap }
