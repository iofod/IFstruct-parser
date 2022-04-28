class IFstruct {
  constructor(json) {
    let { appid, CTT, Models, Config } = json

    this.appid = appid
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
}

exports.IFstruct = IFstruct