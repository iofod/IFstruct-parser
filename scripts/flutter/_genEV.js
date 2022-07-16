const { getCloneMark, format, writeIn } = require('../common/helper')
const { getPath } = require('./_helper')
const { IF } = require('./_env')
const { genEventContent } = require('./_genEventContent')

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
  let m = {}

  events.forEach((event) => {
    let mdm = event.mds ? '##' + `${event.mds.substring(1)}` : ''
    let obj = {
      fn: `__R__${id}$$${event.event + (event.mds ? '_' + event.mds.substring(1) : '')}__R__`,
    }

    EventDes.forEach((key) => {
      if (event[key]) obj[key] = true
    })

    m[(flutterEVM[event.event] || event.event) + mdm] = obj
  })

  return m
}

function genEVContent() {
  let eventContent = []

  const HSS = IF.ctx.HSS
  const genChildView = (hid, IN = '', DI = 0) => {
    let target = HSS[hid]
    let { content, children, model, events, name } = target

    let CM_arr = getCloneMark(DI)
    let CM = CM_arr.join(" + '|' + ")

    CM = DI > 0 
      ? "'|' + " + CM 
      : "''"

    let isMirror = content == 'base/mirror'
    let { eventMethods } = genEventContent(hid, events, CM)

    eventContent.push(...eventMethods)

    if (isMirror) {
      // mirror only supports zero-dimensional values at compile time,
      // so there is no need to consider the multidimensional case.
      let uv = model.use.value

      if (HSS[uv]) {
        genChildView(uv, IN, DI)
      }
    } else {
      if (children && children.length) {
        children.map((id) => genChildView(id, IN, DI))
      }
    }

    let evDict = calcEVM(hid, events)

    if (Object.keys(evDict).length > 0) {
      evMap[hid] = evDict
    }
  }

  let evMap = {}
  let list = [...IF.ctx.pages]

  list.push('Global')
  list.forEach((pid) => {
    HSS[pid].children.forEach((id) => {
      let { events, children } = HSS[id]
      let { eventMethods } = genEventContent(id, events, 'clone')

      eventContent.push(...eventMethods)

      children.map((cid) => genChildView(cid, '\t', 0))

      let evDict = calcEVM(id, events)

      if (Object.keys(evDict).length > 0) evMap[id] = evDict
    })
  })

  //============= Global =================
  let { eventMethods } = genEventContent('Global', HSS['Global'].events, 'clone')

  eventContent.push(...eventMethods)

  let evDict = calcEVM('Global', HSS['Global'].events)

  if (Object.keys(evDict).length > 0) evMap['Global'] = evDict
  //======================================

  // The elements of clone need to be de-duplicated.
  eventContent = [...new Set(eventContent)].join('\n\n')

  return `// ignore_for_file: unused_local_variable, unused_import
import '../common/FA.dart';
import '../common/FX.dart';
import '../common/FN.dart';
import '../common/MF.dart';

${eventContent}

final eventMap = ${JSON.stringify(evMap, null, 2)
    .replaceAll('"__R__', '')
    .replaceAll('__R__"', '')};
`
}

function genEV() {
  let evContent = genEVContent()

  let evRoad = getPath('components/EV.dart')

  writeIn(evRoad, format(evContent, 'dart'))
}

exports.genEV = genEV
