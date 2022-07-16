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

const RegModelVar = /\$([_a-zA-Z]\w+)(<\w*>)?/g

class IFstruct {
  constructor(json) {
    let { CTT, Models, Config } = json

    this.CTT = CTT
    this.json = json
    this.Models = Models
    this.Config = Config
  }
  get T() {
    return this.CTT.T
  }
  get pages() {
    return this.T.pages
  }
  get HSS() {
    return this.T.HSS
  }
  get table() {
    return this.Models.table
  }
  get Fx() {
    return this.Models.Fx
  }
  get MF() {
    return this.Models.MF
  }
  get util() {
    return this.Models.util
  }
  get mainPage() {
    return this.Config.setting.mainPage
  }
  getActiveMetaState(hid) {
    let target = this.HSS[hid]

    return target.status.filter((state) => !state.name.includes(':') && state.active)[0]
  }
  parseModelStr(target, hid) {
    if (typeof target != 'string') return target
    if (target.indexOf('# ') == 0) return this.parseModelExp(target, hid)
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

      sets = this.HSS[id]

      let model = sets.model[key]

      if (!model) return ''

      target = this.parseModelStr(model.value, id)
    } catch (e) {
      console.warn('parseModelStr error:', target, hid, e)

      target = ''
    }
    return target
  }
  parseModelExp(exp, hid, runtime = true) {
    if (typeof exp != 'string') return exp

    let isComputed = exp.indexOf('# ') == 0

    if (!exp.includes('$') && !isComputed) return exp

    let list = exp.match(RegModelVar) || []

    list.forEach(ms => {
      let V = this.parseModelStr(ms, hid)
      let isString = typeof V == 'string'

      if (runtime || isComputed) {
        if (isString) {
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
}

exports.IFstruct = IFstruct
