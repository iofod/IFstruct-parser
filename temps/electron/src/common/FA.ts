import FN from './FN'
import { $store } from '../store'
import whileAsync from './whileAsync'

const AniList = {}

function alert(data, next) {
  (window as any).alert(data)

  next(data)
}

function router(data, next) {
  let { during, target } = data

  if ($store.app.currentPage == target) return

  FN.PS.publish('Fx_router_change', data)

  setTimeout(() => {
    next('router done!')
  }, during)
}

function routerGo(param, next) {
  FN.PS.publish('Fx_router_go', {
    param,
  })

  next('Fx_router_go Done!')
}

function statuToggle(data, next) {
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

  if (typeof target != 'string') return console.warn(target, 'is invalid')
  if (typeof key != 'string') return console.warn(key, 'is invalid')

  if (value === 'false') value = false
  if (value === 'true') value = true

  FN.SET_MODEL(target)(
    key,
    value,
    exp
      .split(':')
      .map((v) => '$' + v)
      .join(':')
  )

  next()
}

const arrFirst = (arr) => (Array.isArray(arr) && arr.length < 2 ? arrFirst(arr[0]) : arr)

function getModel(data, next) {
  let { target, key, exp } = data

  if (typeof target != 'string') return console.warn(target, 'is invalid')
  if (typeof key != 'string') return console.warn(key, 'is invalid')

  let arr = FN.GET_MODEL(target)(
    key,
    exp
      .split(':')
      .map((v) => '$' + v)
      .join(':')
  )

  arr = arrFirst(arr)

  next(arr)
}

function getIndex(data, next) {
  let { index = 0 } = data
  next(index)
}

function animate(data, next) {
  let { async } = data

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
    ani.seek(Math.floor((param / 100) * ani.duration))
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
    obj[key] = (arg) =>
      new Promise((next, err) => {
        if (!fn) {
          return err(key + 'is undefined')
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
    let [fn, args] = action

    if (typeof args == 'object') {
      args.config = config
    }

    config.response = await fn(args)
  } else {
    if (!(actions.length > config.index + 1)) return
  }

  config.index++

  exec(config)
}

export default {
  ...promisify({
    alert,
    router,
    routerGo,
    timeout,
    statu,
    statuToggle,
    activateStatu,
    frozenStatu,
    setModel,
    getModel,
    getIndex,
    animate,
    animateCommand,
    animateProgress,
    useInteractionFlow,
    useInterpolation,
    editStatu,
    setCPA,
  }),
  promisify,
  exec,
  AniList,
  whileAsync
}
