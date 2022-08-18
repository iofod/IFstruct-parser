import { getCloneMark, format, writeIn } from '../common/helper'
import { getPath } from './_helper'
import { IF } from './_env'
import { genEventContent } from './_genEventContent'

// Map iofod events to the flutter event system.
const flutterEVM = {
  tap: 'onTap',
  click: 'onTap',
  swipe: 'onTap',
  longtap: 'onLongPress',
  touchstart: 'onPanDown',
  touchmove: 'onPanUpdate',
  touchend: 'onPanEnd',
  touchcancel: 'onPanCancel',
  pointerdown: 'onPanDown',
  pointermove: 'onPanUpdate',
  pointerup: 'onPanEnd',
  pointercancel: 'onPanCancel',
}

const EventDes = ['passive', 'once', 'prevent', 'stop', 'self']

function calcEVM(id, events) {
  const m = {}

  events.forEach((event) => {
    const mdm = event.mds ? '##' + `${event.mds.substring(1)}` : ''
    const obj = {
      fn: `__R__${id}$$${
        event.event + (event.mds ? '_' + event.mds.substring(1) : '')
      }__R__`,
    }

    EventDes.forEach((key) => {
      if (event[key]) obj[key] = true
    })

    m[(flutterEVM[event.event] || event.event) + mdm] = obj
  })

  return m
}

function genEVContent() {
  const eventContent: string[] = []

  const HSS = IF.ctx.HSS
  const genChildView = (hid, IN = '', DI = 0) => {
    const target = HSS[hid]
    const { content, children, model, events } = target

    const CM_arr = getCloneMark(DI)
    let CM = CM_arr.join(" + '|' + ")

    CM = DI > 0 ? "'|' + " + CM : "''"

    const isMirror = content == 'base/mirror'
    const { eventMethods } = genEventContent(hid, events, CM)

    eventContent.push(...eventMethods)

    if (isMirror) {
      // mirror only supports zero-dimensional values at compile time,
      // so there is no need to consider the multidimensional case.
      const uv = model.use.value

      if (HSS[uv]) {
        genChildView(uv, IN, DI)
      }
    } else {
      if (children && children.length) {
        children.map((id) => genChildView(id, IN, DI))
      }
    }

    const evDict = calcEVM(hid, events)

    if (Object.keys(evDict).length > 0) {
      evMap[hid] = evDict
    }
  }

  const evMap = {}
  const list = [...IF.ctx.pages]

  list.push('Global')
  list.forEach((pid) => {
    HSS[pid].children.forEach((id) => {
      const { events, children } = HSS[id]
      const { eventMethods } = genEventContent(id, events, 'clone')

      eventContent.push(...eventMethods)

      children.map((cid) => genChildView(cid, '\t', 0))

      const evDict = calcEVM(id, events)

      if (Object.keys(evDict).length > 0) evMap[id] = evDict
    })
  })

  //============= Global =================
  const { eventMethods } = genEventContent(
    'Global',
    HSS['Global'].events,
    'clone'
  )

  eventContent.push(...eventMethods)

  const evDict = calcEVM('Global', HSS['Global'].events)

  if (Object.keys(evDict).length > 0) evMap['Global'] = evDict
  //======================================

  // The elements of clone need to be de-duplicated.
  const str = [...new Set(eventContent)].join('\n\n')

  return `// ignore_for_file: unused_local_variable, unused_import, unnecessary_brace_in_string_interps
import '../common/FA.dart';
import '../common/FX.dart';
import '../common/FN.dart';
import '../common/MF.dart';

${str}

final eventMap = ${JSON.stringify(evMap, null, 2)
    .replaceAll('"__R__', '')
    .replaceAll('__R__"', '')};
`
}

function genEV() {
  const evContent = genEVContent()

  const evRoad = getPath('components/EV.dart')

  writeIn(evRoad, format(evContent, 'dart'))
}

export { genEV }
