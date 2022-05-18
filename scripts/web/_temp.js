const { getCloneMark, DIMap, Gesture } = require('../common/helper')
const { IF } = require('./_env')
const { genActionList } = require('./_genActionList')

let tree
let customEvent = ['routechange', 'modelchange']
let CE_list = [] // Non-native events

function genEventContent(hid, events, cloneMark, jumpCE = true) {
  let eventMarks = []
  let eventMethods = []
  let isVue3 = IF.framework == 'Vue3'

  events.forEach((evo) => {
    if (jumpCE && customEvent.includes(evo.event)) {
      evo.hid = hid
      CE_list.push(evo)
      return
    }

    hid = evo.hid || hid

    let { event, actions, native } = evo

    let prefix

    switch (event) {
      case 'start':
        event = 'touchstart'

        break
      case 'end':
        event = 'touchend'

        break

      default:
        break
    }

    let isGesture = Gesture.includes(event)

    if (isGesture) {
      prefix = `v-GT-${event}`
    } else {
      prefix = `@${event}${(native === false || isVue3) ? '' : '.native'}`
    }

    ;['passive', 'capture', 'once', 'prevent', 'stop', 'self'].forEach((key) => {
      if (evo[key]) {
        prefix += '.' + key
      }
    })

    let methodName = `${event}_${hid}`
    let mark = cloneMark === `''` ? '' : `, ${cloneMark}`

    if (isGesture) {
      eventMarks.push(`${prefix}="GEV(${methodName}${mark})"`)
    } else {
      eventMarks.push(`${prefix}="EV($event, ${methodName}${mark})"`)
    }

    let execBody = genActionList(hid, actions)

    let acStr = JSON.stringify(actions)
    let use$Response =
      acStr.includes('$response') || acStr.includes('function') || acStr.includes('service')

    let methodBody = `async ${methodName}(e) {
      ${use$Response ? 'let response\n' : ''}${execBody.join('\n')}
    }`

    eventMethods.push(methodBody)
  })

  return {
    eventMarks,
    eventMethods
  }
}

function genTag(hid, tag) {
  let flag = IF.ctx.HSS[hid].status.filter(
    (statu) => statu.props.option.IAA || statu.props.option.IAA
  ).length

  return flag ? 'A' + tag : tag
}

function genChildView(hid, IN = '', DI = 0, eventContent) {
  let target = tree[hid] //|| HSS[hid]

  let { content, type, model, events, name, remarks } = target

  let [ui, cname] = content.split('/')
  let getTag

  // 内置系统UI的别名
  if (ui == 'base') {
    ui = 'IF'
  } else {
    ui = ''
  }

  let hasCopy = false

  if (model.hasOwnProperty('copy')) {
    hasCopy = true
    DI += 1
  } else {
    hasCopy = false
  }

  let LM = DIMap[DI] // loop mark
  let CM_arr = getCloneMark(DI)
  let CM = CM_arr.join(" + '|' + ")

  CM = DI > 0 ? "'|' + " + CM : "''"

  let str
  let isMirror = content == 'base/mirror'
  let cloneMark = CM != "''" ? ` :clone="${CM}"` : ``

  const tag = genTag(hid, `${ui}${cname}`)

  let { eventMarks, eventMethods } = genEventContent(hid, events, CM)

  eventContent.push(...eventMethods)

  const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : '' //eventBinding

  let CID = DI > 1 ? `'${hid + "', " + CM_arr.slice(0, CM_arr.length - 1).join(', ')}` : `'${hid}'`

  if (type == 'unit' && !isMirror) {
    let unitHead = `${IN}\t<${tag} class="U-unit" hid="${hid}"${EBD}`

    if (hasCopy) {
      str = `${unitHead} v-for="(_, ${LM}) in CID(${CID})" :key="'${hid}' + ${CM}"${cloneMark}></${tag}>`
    } else {
      str = `${unitHead}${cloneMark}></${tag}>`
    }
  } else {
    // container or mirror
    IN += '\t'

    let inject = isMirror ? ' class="U-unit"' : ''
    let wrapHead = `${IN}<${tag}${inject} hid="${hid}"${EBD}`

    if (hasCopy) {
      getTag = (v) =>
        `${wrapHead} v-for="(_, ${LM}) in CID(${CID})" :key="'${hid}' + ${CM}"${cloneMark}>${v}</${tag}>`
    } else {
      getTag = (v) => `${wrapHead}${cloneMark}>${v}</${tag}>`
    }

    if (isMirror) {
      let uv = target.model.use.value

      if (tree[uv]) {
        str = getTag(`${IN}\n` + genChildView(uv, IN, DI, eventContent) + `\n${IN}`)
      } else {
        str = getTag(``)
      }
    } else {
      // container
      let comment = ``
      // 去掉默认值
      if (name != '容器' && name != 'container') {
        let rtxt = ` `
        if (remarks) {
          remarks = remarks.split('\n').join(`\n${IN}`)
          rtxt = ` : \n${IN}${remarks}\n${IN}`
        }
        comment = `${IN}<!-- ${name}${rtxt}-->\n`
      }
      if (target.children && target.children.length) {
        str =
          `${comment}` +
          getTag(
            target.children
              .map((id, index) => `\n` + genChildView(id, IN, DI, eventContent))
              .join('') + `\n${IN}`
          )
      } else {
        str = `${comment}` + getTag(``)
      }
    }
  }

  return str
}

function genCreated(lid) {
  if (!CE_list.length) return ``

  let { eventMethods } = genEventContent(lid, CE_list, 'clone', false)

  let str = ``

  CE_list.forEach((evo, I) => {
    let { hid, event, mds, target, once } = evo

    let subscriber = once ? 'FN.PS.subscribeOnce' : 'FN.PS.subscribe'

    let fn_name = eventMethods[I].replace('async', 'async function')
    let sub_name = event == 'modelchange' ? `${target || hid}.${mds}.${event}` : event

    str += `
    FN.PS.unsubscribe(FN.PS_ID.${hid}_${event})
    FN.PS_ID.${hid}_${event} = ${subscriber}('${sub_name}', this.GEV(${fn_name}))`
  })

  CE_list = []

  return `
  created() {
    ${str}
  },`
}

exports.genViewContent = (lid, payload) => {
  tree = payload

  let eventContent = []
  let childview = tree[lid].children
    .map((cid, index) => genChildView(cid, '\t', 0, eventContent))
    .join('\n')

  let { eventMarks, eventMethods } = genEventContent(lid, tree[lid].events, 'clone')

  eventContent.push(...eventMethods)

  const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : '' //eventBinding

  eventContent = [...new Set(eventContent)].join(',')

  let Lmark = genTag(lid, 'IFlevel')

  return `<template>
  <${Lmark} class="wrap" hid="${lid}" :clone="clone" :style="STYLE"${EBD}>
  <div class="frame" :style="LAYOUT">
${childview}
  </div>
  </${Lmark}>
</template>

<script>
import FA from '../common/FA'
import FX from '../common/FX'
import MF from '../common/MF'

export default {${genCreated(lid)}
  methods: {
    ${eventContent}
	},
	mounted() { }
}
</script>  
`
}
