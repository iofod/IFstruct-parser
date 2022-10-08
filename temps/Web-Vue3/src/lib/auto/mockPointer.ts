import FN from '../../common/FN'
import GV from '../GV/index'
import { $store } from '../../store/index'
const Global = $store.history

async function playRecord(ME, arr) {
  let cursor = Global.previewCursor
  let ox = cursor.x
  let oy = cursor.y

  cursor.useTransition = false

  for (let obj of arr) {
    if (obj == 'E') {
      FN.PS.publish('ProxyMouseupSync')

      return
    }

    let { x, y, dx, dy } = obj

    ME.x = x
    ME.y = y
    ME.dx = dx
    ME.dy = dy
    cursor.x = ox + dx
    cursor.y = oy + dy

    await GV.sleep(34)
  }
}

export function playMouseRecord(eid) {
  let ME = {
    x: 0, y: 0, dx: 0, dy: 0
  }

  let arr = Global.interactionRecord[eid]

  playRecord(ME, arr)

  return ME
}

export function cleanMouseRecord() {
  Global.interactionRecord = {}
  Global.previewEventMap = {}
  Global.previewCursor.x = -20
  Global.previewCursor.y = -20
}
