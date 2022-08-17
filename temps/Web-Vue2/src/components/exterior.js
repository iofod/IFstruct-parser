import { Dependents, Entrys } from '../externals/index'

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
  async load() {
    let cacheTarget = this.isEntry ? iofodEntrys : iofodExteriors
    let name = this.name
    let cache = cacheTarget[name]

    if (cache && cache.state == 'loaded') return cache

    let VM = this

    if (VM.state == 'loading') return VM

    VM.state = 'loading'

    let dependenceTarget = VM.isEntry ? Entrys : Dependents
    let callback = dependenceTarget[VM.src]

    if (typeof callback != 'function') {
      console.warn(VM.src, 'is not a function')

      return VM
    }

    cacheTarget[VM.name] = VM

    try {
      let module = await callback()

      VM.state = 'loaded'
      VM.ready = true

      if (VM.isEntry) {
        VM.setup = module.setup
      }

    } catch (e) {
      console.warn(e)
      
      VM.state = 'error'
      VM.ready = false
    }

    cacheTarget[VM.name] = VM

    return VM
  }
  setup(el) {}
}