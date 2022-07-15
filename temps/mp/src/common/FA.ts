import Taro from '@tarojs/taro'
import FN from './FN'
import whileAsync from './whileAsync'

const warn = console.warn
const AniList = {}

function alert(data, next) {
  console.log(data);
  // Taro.showToast({
  //   title: String(data),
  //   icon: 'none',
  //   mask: true,
  //   success() {
  //     setTimeout(() => {
  //       Taro.hideToast()
  //     }, 2000)
  //   }
  // })
  next(data)
}

function router(data, next) {
  let navigate = Taro.navigateTo

  if (data.replace) {
    navigate = Taro.redirectTo
  }

  navigate({
    url: '/pages/' + data.target + '/index',
    success(e) {
      next(e)
    },
    fail(e) {
      next(e)
    }
  })
}


function routerGo(param, next) {
  let num = Number(param)

  if (num > 0) return console.warn(num, '无效')
  // mp 版本只支持前进
  Taro.navigateBack({
    delta: num * -1
  })

  next('Fx_router_go Done!')
}

function statuToggle(data, next) {
   // warn('statuToggle')
  let { async, during } = data

  FN.PS.publish('Fx_statu_change', data)

  if (async) {
    next('statuToggle done!')
  } else {
    setTimeout(() => {
      next('statuToggle done!')
    }, during)
  }
}

function statu(data, next) {
  // warn('statu')
  FN.PS.publish('Fx_statu_change', data)

  let { async, during } = data

  if (async) {
    next('statu done!')
  } else {
    setTimeout(() => {
      next('statu done!')
    }, during)
  }
}

function activateStatu(data, next) {
  data.active = true

  FN.PS.publish('Fx_changeActive', data)

  let { async, during } = data

  if (async) {
    next('statu done!')
  } else {
    setTimeout(() => {
      next('statu done!')
    }, during)
  }
}

function frozenStatu(data, next) {
  data.active = false

  FN.PS.publish('Fx_changeActive', data)
  let { async, during } = data

  if (async) {
    next('statu done!')
  } else {
    setTimeout(() => {
      next('statu done!')
    }, during)
  }
}

function timeout(data, next) {
  setTimeout(() => {
    next('timeout done!')
  }, data)
}

function setModel(data, next) {
  let { target, key, exp, value } = data

  if (typeof target != 'string') return warn(target, '格式错误')
  if (typeof key != 'string') return warn(key, '格式错误')

  // 对 true/false 进行特殊处理
  if (value === 'false') value = false
  if (value === 'true') value = true

  FN.SET_MODEL(target)(key, value, exp.split(':').map(v => '$' + v).join(':'))

  next()
}

const arrFirst = arr => (Array.isArray(arr) && arr.length < 2) ? arrFirst(arr[0]) : arr

function getModel(data, next) {
  let { target, key, exp } = data

  if (typeof target != 'string') return warn(target, '格式错误')
  if (typeof key != 'string') return warn(key, '格式错误')

  // 新API，无历史兼容问题
  let arr = FN.GET_MODEL(target)(key, exp.split(':').map(v => '$' + v).join(':'))
  // 这里获得的是数组对象，因此最好加上一个配置，进行拍平，方便后面的程序处理
  // 先约定默认单/无元素数组，则直接取其数据
  arr = arrFirst(arr)

  next(arr)
}

function getIndex(data, next) {
  let { index = 0 } = data
  next(index)
}

function animate(data, next) {
  let { async, during } = data

  data.next = next

  FN.PS.publishSync('Fx_animate', data)

  if (async) {
    next('animate done!')
  } else {
  }
}

function animateCommand(data, next) {
  let { param } = data

  let ani = AniList[data.hid]

  if (ani) {
    ani[param]()
  }

  next('animateCommand done!')
}

function animateProgress(data, next) {
  let { param } = data

  let ani = AniList[data.hid]

  if (ani) {
    ani.seek(Math.floor(param / 100 * ani.duration))
  }

  next('animateProgress done!')
}

function useInteractionFlow(data, next) {
  let { async } = data

  data.next = next

  FN.PS.publishSync('Fx_interactionFlow', data)

  if (async) {
    next('useInteractionFlow done!')
  }
}

function useInterpolation(data, next) {
  let { async } = data

  data.next = next

  FN.PS.publishSync('Fx_interpolation', data)

  if (async) {
    next('useInterpolation done!')
  }
}

function editStatu(data, next) {
  FN.PS.publishSync('Fx_editStatu', data)

  next('editStatu done!')
}

function setCPA(data, next) {
  FN.PS.publishSync('Fx_setCPA', data)

  next('setCPA done!')
}

function promisify(obj) {
  for (let key in obj) {
    let fn = obj[key]
    obj[key] = arg => new Promise((next, err) => {
      if (!fn) {
        return err(key + '不存在')
      }

      return fn(arg, next)
    })
  }
  return obj
}

async function exec(config) {
  let { actions } = config

  if (!config.hasOwnProperty('index')) {
    config.index = 0
  }

  let action = actions[config.index]

  if (action === undefined) return

  if (action) {
    let [ fn, args ] = action

    if (typeof args == 'object') {
      args.config = config
    }

    config.response = await fn(args)
  } else {
    // 跳过非激活的动作
    if (!(actions.length > config.index + 1)) return
  }

  config.index++

  exec(config)
}

export default {
  ...promisify({
    alert, router, routerGo, timeout,
    statu, statuToggle, activateStatu, frozenStatu,
    setModel, getModel, getIndex,
    animate, animateCommand, animateProgress, useInteractionFlow, useInterpolation,
    editStatu, setCPA
  }),
  promisify,
  exec,
  AniList,
  whileAsync
}
