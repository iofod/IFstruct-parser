const { getCloneMark, DIMap } = require('../common/helper')
const { IF } = require('./_env')
const { CE_list, genEventContent } = require('./_genEventContent')

function genTag(hid, tag) {
  return tag
}

function genViewContent(lid, tree) {
  let eventContent = []

  const genChildView = (hid, IN = '', DI = 0) => {
    let target = tree[hid]
    let { content, type, model, events, name, remarks } = target
    let [ui, cname] = content.split('/')
    let getTag

    if (ui == 'base') {
      ui = 'IF'
    } else {
      // If it is not a base component, the lib prefix is not added,
      // as the requirement itself is self-contained.
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

    let CID =
      DI > 1 ? `'${hid + "', " + CM_arr.slice(0, CM_arr.length - 1).join(', ')}` : `'${hid}'` // copy 比普通的 model 小一个维度，所以这里判定条件为 1

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
          str = getTag(`${IN}\n` + genChildView(uv, IN, DI) + `\n${IN}`)
        } else {
          str = getTag(``)
        }
      } else {
        // container
        let comment = ``

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
              target.children.map((id, index) => `\n` + genChildView(id, IN, DI)).join('') +
                `\n${IN}`
            )
        } else {
          str = `${comment}` + getTag(``)
        }
      }
    }

    return str
  }

  let childview = tree[lid].children.map((cid, index) => genChildView(cid, '\t', 0)).join('\n')

  let { eventMarks, eventMethods } = genEventContent(lid, tree[lid].events, 'clone')

  eventContent.push(...eventMethods)

  const EBD = eventMarks.length > 0 ? ' ' + eventMarks.join(' ') : '' //eventBinding

  eventContent = [...new Set(eventContent)].join(',')

  let readyContent = []

  let created = ``

  const genCreated = () => {
    if (!CE_list.length) return

    let { eventMarks, eventMethods } = genEventContent(lid, CE_list, 'clone', false)

    let genStr = (str) => `
		created() {
			${str}
		},`

    let str = ``
    let unstr = ``([...CE_list]).forEach((evo, I) => {
      let { hid, event, mds, target, once } = evo

      let subscriber = once ? 'FN.PS.subscribeOnce' : 'FN.PS.subscribe'

      let fn_name = eventMethods[I].replace('async', 'async function')
      let sub_name = event == 'modelchange' ? `${target || hid}.${mds}.${event}` : event

      str += `
			FN.PS.unsubscribe(FN.PS_ID.${hid}_${event})
			FN.PS_ID.${hid}_${event} = ${subscriber}('${sub_name}', this.GEV(${fn_name}))`

      unstr += ``

      CE_list.pop()
    })

    created = genStr(str)
  }

  genCreated()

  let Lmark = genTag(lid, 'IFlevel')

  return `<template>
  <${Lmark} class="wrap" hid="${lid}" :clone="clone" :style="STYLE"${EBD}>
${childview}
  </${Lmark}>
</template>

<script>
import FN from '@common/FN'
import FA from '@common/FA'
import FX from '@common/FX'
import MF from '@common/MF'
import UT from '@common/UT'

export default {${created}
  methods: {
    ${eventContent}
	},
	mounted() {
		${readyContent}
	}
}
</script>  
`
}

exports.genViewContent = genViewContent
