import { Dependents, Entrys } from '../externals/index'
import GV from '../common/GV'
import FN from '../common/FN'

const iofodExteriors = {}
const iofodEntrys = {}

export class Exterior {
  constructor(conf) {
    this.ready = false
    this.state = 'prepare'
    this.name = conf.name
    this.src = conf.src
    this._ = GV.T(10)
    this.isEntry = !!conf.isEntry
  }
  load() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async done => {
      let cacheTarget = this.isEntry ? iofodEntrys : iofodExteriors
      let url = this.src
      let cache = cacheTarget[url]

      if (cache && cache.state == 'loaded') return done(cache)

      if (!cache) {
        cache = cacheTarget[url] = this
      }

      if (cache.state == 'loading') {
        FN.PS.subscribeOnce(url, (_, vm) => {
          done(vm)
        })

        return
      }

      cache.state = 'loading'

      let dependenceTarget = cache.isEntry ? Entrys : Dependents
      let callback = dependenceTarget[url]

      if (typeof callback != 'function') {
        console.warn(url, 'is not a function')

        return done(cache)
      }

      try {
        let module = await callback()

        cache.state = 'loaded'
        cache.ready = true

        if (cache.isEntry) {
          cache.setup = module.setup
          cache.destory = module.destory
        }

        FN.PS.publishSync(url, cache)

      } catch (e) {
        console.warn(e)

        cache.state = 'error'
        cache.ready = false
      }

      return done(cache)
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setup() {}
}
