import md5 from 'blueimp-md5'
import cloneDeep from 'lodash.clonedeep'

import { warn, log, sleep, throttle, RP, inject, styleInject, uuid, randomStr, T } from './helper'
import { URL2Obj, Obj2URL, getURLconfig, getURLparams } from './url'
import {
  getLocal,
  saveLocal,
  removeLocal,
  getSession,
  saveSession,
  removeSession,
  GStorage,
} from './store'
import { getStorage, removeStorage, saveStorage, updateStorage } from './serviceCache'

(window as any).styleInject = styleInject

// Global Vendor
const GV = {
  md5,
  cloneDeep,
  warn,
  log,
  sleep,
  throttle,
  RP,
  inject,
  styleInject,
  uuid,
  randomStr,
  URL2Obj,
  Obj2URL,
  getURLconfig,
  getURLparams,
  getLocal,
  saveLocal,
  removeLocal,
  getSession,
  saveSession,
  removeSession,
  GStorage,
  getStorage,
  removeStorage,
  saveStorage,
  updateStorage,
  T,
}

export default GV
