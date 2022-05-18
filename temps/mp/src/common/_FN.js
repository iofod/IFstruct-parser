import FN from './FN'
import CTX from './_FA'
import anime from './anime'
import $store from '../store/index'

const warn = console.warn
const log = console.log

var FLOW_CACHE = {}
var FLOW_PS = {}

import { BehaviorSubject } from "rxjs"

const Rx = {
  BehaviorSubject
}

var __currentClone__ = {}


const update = (name, data) => {
  let { id: mid } = $store.state.models[name]

  FLOW_CACHE[mid].next(data)
}

function setCurrentClone(hid, clone) {
  let CCLONE = __currentClone__
  CCLONE[hid] = clone
  let item = FN.SETS(hid)
  if (item) {
    item.children.forEach(id => {
      if (!CCLONE[id] || (CCLONE[id] && !CCLONE[id].startsWith(clone))) {
        setCurrentClone(id, clone)
      }
    })
  }
}

function removeCurrentClone(hid) {
  delete __currentClone__[hid]
  
  let item = FN.SETS(hid)
  if (item) {
    item.children.forEach(id => {
      delete __currentClone__[id]
    })
  }
}

function finder(paths, data) {
  let p = data
  paths.forEach(e => {
      p = p[e]
  })
  return p
}

function getArrayDeepth(array) {
  if (!Array.isArray(array)) return 0

  function sum(arr, flag) {
    return arr.reduce(function(total, item) {
      var totalDeepth
      if (Array.isArray(item)) {
        totalDeepth = sum(item, flag + 1)
      }
      return totalDeepth > total ? totalDeepth : total
    }, flag)
  }
  return sum(array, 1)
}

/** 检查表达式
 * 1. $i 静态值 | 表达式
 * 2. $n 活动的索引 => 暂时不实现
 * 3. $even => 使用上不支持表达式
 * 4. $odd => 使用上不支持表达式
 * 5. ${正则} => 使用上不支持表达式
 * 6. 6.1 $model => 具体模型字段 => 支持   6.2 $model<Global>
 * 7. $N 任意数
 * 该函数 this 指向为 sets
 */
function subExpCheck(exps, v, I, hid) {
  try {
    let exp = exps
    // 5. 正则单独占用一个表达式的位置，可以直接返回
    let rreg = exp.match(/^\${(.+)}$/)
    if (rreg) {
      return new RegExp(rreg[1]).test(v)
    }

    // odd even, 也是单独存在
    let calc = Number(v) % 2
    // 4.
    if (exp == '$odd') {
      return calc == 1
    }
    // 3.
    if (exp == '$even') {
      return calc != 1
    }
    // 7.
    if (exp == '$N') {
      return true
    }

    //针对小程序的特殊处理
    let use$n = exp.includes('$n')
    let curr = 0
    if (use$n) {
      if (!__currentClone__.hasOwnProperty(hid)) return false
      
      curr = __currentClone__[hid].split('|')[I + 1]

      exp = exp.replace(/\$n(?=\W)/g, curr).replace(/\$n$/, curr) //eg: '$n + $nk + $n + $n'
    }

    let exec = FN.ExpsMap[exp]

    if (exec) {
      exp = exec(v, curr, hid) //$i, $n, hid
    } else {
      //这是 GET 获取相关的触发，不走预编译状态表达式，有且只有单个表达式，如： $0
      exp = Number(exp.replace('$', ''))
    }

    return typeof exp == 'boolean' ? exp : exp == v
  } catch (e) {
    warn('解析状态表达式错误:',e)
    return false
  }
}

function subExpFilter(exps, data, hid, ei = 0) {
  if (!Array.isArray(data) || !exps.length) return data

  let exp = exps.shift()

  // 所绑定的模型数据可以粗略认为其数组结构映射着 clone
  // 加之为数据筛选器，那么理应由他作为参考标准
  let arr = data.filter((sub, I) => {
    return FN.subExpCheck(exp, I, ei, hid)
  })

  return arr.map(v => subExpFilter(exps, v, hid, ei + 1))
}

// handle 为parent对象
function subExpWrite(exps, data, hid, ei = 0, value, handle = null, hi = 0) {
  if (!Array.isArray(data) || !exps.length) {
    if (handle) {
      handle.splice(hi, 1, value)
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

  return function() {
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
      timeout = setTimeout(function() {
        fn.apply(context, args)
      }, wait)
    }
  }
}

function ModelHandle(id, key, target) {
  let sid = id + '.' + key

  // 放到 parseModelStr，对任意用到的 key 进行重新监听
  if (!FLOW_PS[sid]) {
    let md = target.model[key]

    if (md && md.use) {
      let tb = md.use.split('.')[0]

      if (!FLOW_CACHE[tb]) {
        FLOW_CACHE[tb] = new Rx.BehaviorSubject(undefined) 
      }
      
      FLOW_PS[sid] = FLOW_CACHE[tb].subscribe({
        next: v => {
          FN.subscribeFlow(tb, id, key, v)
        }
      })
    }
  }
}

const SystemModelMap = {
  $current(hid) {
    return hid
  },
  //TODO
  $parent(hid) {
    return ''
  },
  //TODO
  $box(hid) {
    return {}
  },
  $response(hid) {
    return hid
  }
}

function parseModelStr(target, hid) {
  if (typeof target != 'string') return target

  if (target.indexOf('# ') == 0) return parseModelExp(target, hid)

  if (target.slice(0, 1) != '$') return target

  let inner = SystemModelMap[target]

  if (inner) return inner(hid)

  let select = target.match(/\$([_a-zA-Z]\w+)<(.+)>/) // "$Bo<Global>" => "$Bo<Global>", "Bo", "Global"

  try {
    let key
    let id
    let sets
    if (select) {
      key = select[1]
      id = select[2]
    } else {
      key = target.substr(1)
      id = hid
    }

    sets = FN.SETS(id)

    FN.ModelHandle(id, key, sets)

    let model = sets.model[key]

    if (!model) return ''

    target = FN.parseModelStr(model.value, id)
  } catch (e) {
    // 可能发生语法错误，或者死循环
    console.warn('解析模型字段错误：', target, hid, e)
    target = ''
  }
  return target
}

function parseModelExp(exp, hid, runtime = true) {
  if (typeof exp != 'string') return exp

  let isComputed = exp.indexOf('# ') == 0

  if (isComputed) {
    let exec = FN.ExpsMap[exp]

    if (exec) return exec(hid)
  }

  if (!exp.includes('$')) return exp

  let list = exp.match(/\$([_a-zA-Z]\w+)(_\w+)?(<.+?>)?/g) || []

  list.forEach(ms => {
    let V =  FN.parseModelStr(ms, hid)

    if (runtime || isComputed) {
      V = typeof V == 'string' ? `'${V}'` : typeof V == 'object' ? JSON.stringify(V) : V
    }

    exp = exp.replace(new RegExp('\\' + ms, 'gm'), V)
  })

  return exp
}

const arrFirst = arr => (Array.isArray(arr) && arr.length < 2) ? FN.arrFirst(arr[0]) : arr
const tfClone = clone => clone.split('|').filter(v => v).map(v => '$' + v).join(':')

const fillArr = (value, road) => {
  let r = road[0]
  if (r == 'n') {
    road.shift()

    // 说明是多维，需要填充 空数组
    if (road.length > 1) {
      let k = road[0]
      return Array(value.length)
        .fill([])
        .map((a, i) => {
          return fillArr(value[i][k], road.slice(1))
        })
    } else {
      return value.map(obj => obj[road[0]])
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

  let D = path.slice(1).filter(v => v == 'n').length // ZI
  let V

  if (D) {
    V = fillArr(value, path.slice(1))

    CTX.getContext().$set(target, 'value', V)
  } else {
    // 不包含维度 n 的，直接路径值填入
    path.slice(1).forEach(p => {
      value = value[p]
    })

    V = value

    target.value = value
  }
}


export default {
  FLOW: update,
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
  warn,
  log,
  anime,
  tfClone,
  arrFirst,
  subscribeFlow,
  ModelHandle,
  SystemModelMap
  // SDK
}
