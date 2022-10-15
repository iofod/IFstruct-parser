import FN from './FN'
import anime from '../lib/anime'
import SDK from './SDK'

const __currentClone__ = {}

function setCurrentClone(hid: string, clone) {
  let CCLONE = __currentClone__
  CCLONE[hid] = clone
  let item = FN.SETS(hid)
  if (item) {
    item.children.forEach((id: string) => {
      if (!CCLONE[id] || (CCLONE[id] && !CCLONE[id].startsWith(clone))) {
        setCurrentClone(id, clone)
      }
    })
  }
}

function removeCurrentClone(hid: string) {
  delete __currentClone__[hid]

  let item = FN.SETS(hid)
  if (item) {
    item.children.forEach((id: string) => {
      delete __currentClone__[id]
    })
  }
}

function finder(paths, data) {
  let p = data
  paths.forEach((e: string) => {
    p = p[e]
  })
  return p
}

function getArrayDeepth(array) {
  if (!Array.isArray(array)) return 0

  function sum(arr, flag) {
    return arr.reduce(function (total, item) {
      var totalDeepth
      if (Array.isArray(item)) {
        totalDeepth = sum(item, flag + 1)
      }
      return totalDeepth > total ? totalDeepth : total
    }, flag)
  }
  return sum(array, 1)
}

const RegModelVar = /\$([_a-zA-Z]\w+)(<\w*>)?/g

function subExpCheck(exps, v, I, hid) {
  try {
    let exp = exps
    let rreg = exp.match(/^\${(.+)}$/)

    if (rreg) {
      return new RegExp(rreg[1]).test(v)
    }

    let calc = Number(v) % 2
    if (exp == '$odd') {
      return calc == 1
    }
    if (exp == '$even') {
      return calc != 1
    }
    if (exp == '$N') {
      return true
    }

    let nreg = exp.match(/\$\d+/g)
    if (nreg) {
      nreg.forEach((md) => {
        exp = exp.replace(md, md.slice(1))
      })
    }

    let modelReg = exp.match(RegModelVar)
    if (modelReg) {
      modelReg.forEach(ms => {
        let V =  parseModelStr(ms, hid)

        V = typeof V == 'string' ? `'${V}'` : typeof V == 'object' ? JSON.stringify(V) : V

        exp = exp.replace(new RegExp('\\' + ms, 'g'), V)
      })
    }

    if (exp.includes('$n')) {
      if (!__currentClone__.hasOwnProperty(hid)) {
        return false
      }
      let curr = __currentClone__[hid].split('|')[I + 1]

      exp = exp.replace(/\$n/g, curr)
    }

    if (exp.includes('$i')) {
      exp = exp.replace(/\$i/g, v)
    }

    exp = eval(exp)

    return typeof exp == 'boolean' ? exp : exp == v
  } catch (e) {
    console.warn('subExpCheck error:', e)
    return false
  }
}

function subExpFilter(exps, data, hid, ei = 0) {
  if (!Array.isArray(data) || !exps.length) return data

  let exp = exps.shift()

  let arr = data.filter((sub, I) => {
    return FN.subExpCheck(exp, I, ei, hid)
  })

  return arr.map((v) => subExpFilter(exps, v, hid, ei + 1))
}

function subExpWrite(exps, data, hid, ei = 0, value, handle, hi = 0) {
  if (!Array.isArray(data) || !exps.length) {
    if (handle) {
      (handle as any).splice(hi, 1, value)
    }

    return
  }

  let exp = exps.shift()

  data.forEach((sub, I) => {
    if (FN.subExpCheck(exp, I, ei, hid)) {
      subExpWrite(exps, sub, hid, ei + 1, value, data, I)
    }
  })
}

function debounce(wait, fn, immediate = false) {
  let timeout

  return function () {
    let context = this
    let args = arguments

    if (timeout) clearTimeout(timeout)
    if (immediate) {
      let callNow = !timeout
      timeout = setTimeout(() => {
        timeout = null
      }, wait)
      if (callNow) fn.apply(context, args)
    } else {
      timeout = setTimeout(function () {
        fn.apply(context, args)
      }, wait)
    }
  }
}

const FLOW_PS = {}
const FLOW_CACHE = {};

function ModelHandle(id: string, key: string, target) {
  let sid = id + '.' + key

  if (!FLOW_PS[sid]) {
    let md = target.model[key]

    if (md && md.use) {
      let tb = md.use.split('.')[0]

      FLOW_PS[sid] = FLOW_CACHE[tb].subscribe({
        next: (v) => {
          FN.subscribeFlow(tb, id, key, v)
        },
      })
    }
  }
}

const SystemModelMap = {
  $current(hid) {
    return hid
  },
  //TODO
  $parent() {
    return ''
  },
  //TODO
  $box(hid) {
    return {}
  },
  $response(hid) {
    return hid
  },
};

function parseModelStr(target, hid) {
  if (typeof target != 'string') return target
  if (target.indexOf('# ') == 0) return parseModelExp(target, hid)
  if (target.slice(0, 1) != '$') return target

  let inner = SystemModelMap[target]

  if (inner) return inner(hid)

  let select = target.match(/\$([_a-zA-Z]\w+)<(\w*)>/) // "$Bo<Global>" => "$Bo<Global>", "Bo", "Global"

  try {
    let key
    let id
    let sets
    if (select) {
      key = select[1]
      id = select[2]
    } else {
      key = target.slice(1)
      id = hid
    }

    sets = FN.SETS(id)

    FN.ModelHandle(id, key, sets)

    let model = sets.model[key]

    if (!model) return ''

    target = parseModelStr(model.value, id)
  } catch (e) {
    console.warn('parseModelStr error:', target, hid, e)

    target = ''
  }
  return target
}

function parseModelExp(exp, hid, runtime = true) {
  if (typeof exp != 'string') return exp

  let isComputed = exp.indexOf('# ') == 0

  if (!exp.includes('$') && !isComputed) return exp

  let list = exp.match(RegModelVar) || []

  list.forEach(ms => {
    let V = parseModelStr(ms, hid)
    let isString = typeof V == 'string'

    if (runtime || isComputed) {
      if (isString) {
        // parser 需要也这样判定
        if (!V.startsWith('# ')) {
          V = `\`${V}\``
        }
      } else {
        V = typeof V == 'object' ? JSON.stringify(V) : V
      }
    }

    exp = exp.replace(new RegExp('\\' + ms, 'gm'), V)
  })

  if (isComputed) {
    return eval(exp.substring(2))
  }

  return exp
}

const arrFirst = (arr) => (Array.isArray(arr) && arr.length < 2 ? FN.arrFirst(arr[0]) : arr)
const tfClone = (clone) =>
  clone
    .split('|')
    .filter((v) => v)
    .map((v) => '$' + v)
    .join(':')

const fillArr = (value, road) => {
  let r = road[0]
  if (r == 'n') {
    road.shift()

    if (road.length > 1) {
      let k = road[0]
      return Array(value.length)
        .fill([])
        .map((a, i) => {
          return fillArr(value[i][k], road.slice(1))
        })
    } else {
      return value.map((obj) => obj[road[0]])
    }
  } else {
    value = value[r]

    road.shift()

    return fillArr(value, road)
  }
}

const subscribeFlow = (pid, hid, key, value) => {
  let target = FN.SETS(hid).model[key]

  const path = target.use.split('.')

  if (path[0] != pid || value === undefined) return false

  let D = path.slice(1).filter((v) => v == 'n').length // ZI
  let V

  if (D) {
    V = fillArr(value, path.slice(1))

    target.value = V
  } else {
    path.slice(1).forEach((p) => {
      value = value[p]
    })

    V = value

    target.value = value
  }
}

export default {
  setCurrentClone,
  removeCurrentClone,
  finder,
  subExpCheck,
  subExpFilter,
  subExpWrite,
  getArrayDeepth,
  debounce,
  parseModelStr,
  parseModelExp,
  anime,
  tfClone,
  arrFirst,
  subscribeFlow,
  ModelHandle,
  SDK,
  SystemModelMap,
  FLOW_CACHE
}
