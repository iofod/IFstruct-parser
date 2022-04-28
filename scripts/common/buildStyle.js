const { localizImage } = require('./downloadAssets')

const flexMap = {
  flex: 'fx',
  'flex-basis': 'fxb',
  'flex-direction': 'fxd',
  'flex-flow': 'fxf',
  'flex-grow': 'fxg',
  'flex-shrink': 'fxs',
  'flex-wrap': 'fxw',
  order: 'od',
  'align-content': 'ac',
  'align-items': 'ai',
  'align-self': 'as',
  'justify-content': 'jc',
  'justify-items': 'ji',
  'justify-self': 'js'
}

const gridMap = {}

const attrMap = {
  animation: 'anim',
  'animation-delay': 'animdel',
  'animation-direction': 'animdir',
  'animation-duration': 'animdur',
  'animation-fill-mode': 'animfm',
  'animation-iteration-count': 'animic',
  'animation-name': 'animn',
  'animation-play-state': 'animps',
  'animation-timing-function': 'animtf',
  appearance: 'ap',

  bottom: 'b',
  background: 'bg',
  'background-color': 'bgc',
  'background-image': 'bgi',
  'background-repeat': 'bgr',
  'background-attachment': 'bga',
  'background-position': 'bgp',
  'background-position-x': 'bgpx',
  'background-position-y': 'bgpy',
  'background-break': 'bgbk',
  'background-clip': 'bgcp',
  'background-origin': 'bgo',
  'background-size': 'bgsz',
  border: 'bd',
  'border-break': 'bdbk',
  'border-collapse': 'bdcl',
  'border-color': 'bdc',
  'border-image': 'bdi',
  'border-top-image': 'bdti',
  'border-top-left-image': 'bdtli',
  'border-top-right-image': 'bdtri',
  'border-right-image': 'bdri',
  'border-bottom-image': 'bdbi',
  'border-bottom-left-image': 'bdbli',
  'border-bottom-right-image': 'bdbri',
  'border-left-image': 'bdli',
  'border-corner-image': 'bdci',
  'border-fit': 'bdf',
  'border-length': 'bdle',
  'border-spacing': 'bdsp',
  'border-style': 'bds',
  'border-width': 'bdw',
  'border-top': 'bdt',
  'border-top-width': 'bdtw',
  'border-top-style': 'bdts',
  'border-top-color': 'bdtc',
  'border-right': 'bdr',
  'border-right-width': 'bdrw',
  'border-right-style': 'bdrst',
  'border-right-color': 'bdrc',
  'border-bottom': 'bdb',
  'border-bottom-width': 'bdbw',
  'border-bottom-style': 'bdbs',
  'border-bottom-color': 'bdbc',
  'border-left': 'bdl',
  'border-left-width': 'bdlw',
  'border-left-style': 'bdls',
  'border-left-color': 'bdlc',
  'border-radius': 'bdrs',
  'border-top-right-radius': 'bdtrrs',
  'border-top-left-radius': 'bdtlrs',
  'border-bottom-right-radius': 'bsbrrs',
  'border-bottom-left-radius': 'bdblrs',
  'box-sizing': 'bxz',
  'box-shadow': 'bxsh',

  clear: 'cl',
  cursor: 'cur',
  color: 'c',
  content: 'cnt',
  'counter-increment': 'coi',
  'counter-reset': 'cor',
  'caption-side': 'cps',
  columns: 'col',
  'column-count': 'colc',
  'column-fill': 'colf',
  'column-gap': 'colg',
  'column-span': 'cols',
  'column-width': 'colw',
  'column-rule': 'colr',
  'column-rule-color': 'colrc',
  'column-rule-style': 'colrs',
  '-column-rule-width': 'colrw',

  'display': 'd',

  'empty-cells': 'ec',

  filter: 'fr',
  fill: 'fi',
  float: 'fl',
  font: 'f',
  'font-weight': 'fw',
  'font-style': 'fs',
  'font-variant': 'fv',
  'font-size': 'fz',
  'font-size-adjust': 'fza',
  'font-family': 'ff',
  'font-effect': 'fef',
  'font-emphasize': 'fem',
  'font-emphasize-position': 'femp',
  'font-emphasize-style': 'fems',
  'font-stretch': 'fst',
  'font-smooth': 'fsm',
  '-webkit-font-smoothing': 'wfsm',

  height: 'h',

  left: 'l',
  'letter-spacing': 'lts',
  'line-height': 'lh',
  'list-style': 'lis',
  'list-style-position': 'lisp',
  'list-style-image': 'lisi',
  'list-style-type': 'list',

  margin: 'm',
  'margin-top': 'mt',
  'margin-right': 'mr',
  'margin-bottom': 'mb',
  'margin-left': 'ml',
  'max-width': 'maw',
  'max-height': 'mah',
  'min-width': 'miw',
  'min-height': 'mih',

  opacity: 'op',
  outline: 'ol',
  'outline-offset': 'olo',
  'outline-width': 'olw',
  'outline-style': 'ols',
  'outline-color': 'olc',
  overflow: 'ov',
  'overflow-x': 'ovx',
  'overflow-y': 'ovy',
  'overflow-style': 'ovs',
  orientation: 'ori',
  orphans: 'orp',

  padding: 'p',
  'padding-top': 'pt',
  'padding-right': 'pr',
  'padding-bottom': 'pb',
  'padding-left': 'pl',
  'page-break-before': 'pgbb',
  'page-break-inside': 'pgbi',
  'page-break-after': 'pgba',
  position: 'pos',
  'pointer-events': 'pe',

  quotes: 'q',

  right: 'r',
  resize: 'rsz',

  'table-layout': 'tbl',
  'text-align': 'ta',
  'text-align-last': 'tal',
  'text-decoration': 'td',
  'text-emphasis': 'te',
  'text-height': 'th',
  'text-indent': 'ti',
  'text-justify': 'tj',
  'text-outline': 'to',
  'text-replace': 'tr',
  'text-transform': 'tt',
  'text-wrap': 'tw',
  'text-shadow': 'tsh',
  'text-overflow': 'tov',
  top: 't',
  transform: 'trf',
  'transform-origin': 'trfo',
  'transform-style': 'trfs',
  transition: 'trs',
  'transition-delay': 'trsde',
  'transition-duration': 'trsdu',
  'transition-property': 'trsp',
  'transition-timing-function': 'trstf',

  'vertical-align': 'va',
  visibility: 'v',

  width: 'w',
  'white-space': 'whs',
  'white-space-collapse': 'whsc',
  'word-break': 'wob',
  'word-spacing': 'wos',
  'word-wrap': 'wow',
  widows: 'wid',

  'z-index': 'Z',
  zoom: 'zm',

  ...flexMap
}

const utilAttrMap = {
  'display: flex': 'dff'
}

function hump2Line(name) {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function line2Hump(name) {
  return name.replace(/\-(\w)/g, function (all, letter) {
    return letter.toUpperCase()
  })
}

const mapHL = {
  h2l: hump2Line,
  l2h: line2Hump,
}

// for json
function humpLineObj(obj, type = 'h2l') {
  let fn = mapHL[type]
  return Object.assign(
    {},
    ...Object.keys(obj).map((key) => {
      let V = obj[key]
      if (typeof V == 'object' && !Array.isArray(V)) {
        V = humpLineObj(V, type)
      }
      return {
        [fn(key)]: V,
      }
    })
  )
}

const humpAttrMap = humpLineObj(attrMap, 'l2h')

function miniAttr(name) {
  if (attrMap[name]) {
    return attrMap[name]
  }

  return name.split('-').map(v => v.substr(0, 1) + v.substr(-1, 1)).join('')
}

function zipAttr(name, l = 1) {
  if (humpAttrMap[name]) {
    return humpAttrMap[name]
  }

  return name.toLocaleUpperCase().substr(0, l)
}

exports.miniAttr = miniAttr
exports.zipAttr = zipAttr

/**
 *  {
 *    'width: 100%': [ hid|I, hid|I+, ...  ]
 *    'height: 333px': [...]
 *  }
 */

function genStyle(ctree, type = 'px', K = 1) {
  let SH = {} // style hash { xxxstyleAttr: [hid, hid....]}
  let HS = {} // reverse style hash { hid:I+: [ attr1, attr2 ]}

  for (let hid in ctree) {
    let target = ctree[hid]
    let { status } = target

    status.forEach((statu, I) => {
      let { active, props } = statu
      let { x, y, d, option, style } = props

      style.left = x + 'px'
      style.top = y + 'px'
      style.transform = 'rotate(' + d + 'deg)'

      if (option.ghost) {
        style.pointerEvents = 'none'
      } else {
        delete style.pointerEvents
      }

      if (!option.V) {
        style.visibility = 'hidden'
      } else {
        delete style.visibility
      }

      delete style.V

      px2any(style, type)
      localizImage(style)

      for (let attr in style) {
        let hash = hump2Line(attr) + ': ' + style[attr]
        let id = hid + '|' + I // 新的规则，不标记 active

        if (SH[hash]) {
          SH[hash].push(id)
        } else {
          SH[hash] = [id]
        }
        if (HS[id]) {
          HS[id].push(hash)
        } else {
          HS[id] = [hash]
        }
      }
    })
  }

  let CT = {}  // common tree
  let IDT = {} // idstyle tree

  let ST = {} // hidHash style tree


  let STC = {} // style tree => common

  let CSL = {} // common style name list { c: [c1, c2]}  c1: 'color:#000000', c2: 'color:#eee'...

  let CTV = {} //characteristic value

  let USM = {} // util style map
  let MUS = {} // reverse util style map



  for (let aid in SH) {
    let avs = SH[aid] // attr value sets

    if (utilAttrMap[aid]) {
      avs.forEach(hid => {
        if (CTV[hid]) {
          CTV[hid].push(utilAttrMap[aid])
        } else {
          CTV[hid] = [utilAttrMap[aid]]
        }
      })

      MUS[utilAttrMap[aid]] = aid

    } else {
      if (avs.length > K) {
        CT[aid] = avs
  
        let [_k, _v] = aid.split(':')
        let name = miniAttr(_k)
  
        let block = {
          oa: aid, // origin attr
          v: _v
        }
  
        if (CSL[name]) {
          CSL[name].push(block)
        } else {
          CSL[name] = [block]
        }
  
        avs.forEach(id => {
          let cv = HS[id][HS[id].indexOf(aid)]
  
          if (STC[id]) {
            STC[id].push(cv[0])
          } else {
            STC[id] = [cv[0]]
          }
        })
      } else {
        IDT[aid] = avs
      }
    }
  }

  for (let hhid in HS) {
    ST[hhid] = HS[hhid].join(';')
  }

  // mini key
  for (let mk in CSL) {
    let barr = CSL[mk]

    barr.forEach((item, J) => {
      let uclass = mk + J

      USM[item.oa] = uclass
      MUS[uclass] = item.oa
    })
  }

  let idTree = {}

  for (let iav in IDT) {
    let ihash = IDT[iav]

    if (idTree[ihash]) {
      idTree[ihash].push(iav)
    } else {
      idTree[ihash] = [iav]
    }
  }

  let commonTree = {}

  for (let cav in CT) {
    let commonSets = CT[cav]

    let ma = USM[cav] // map attr => mini attr , eg:  background-color:#e7e7e7 => bgc0 

    commonSets.forEach(hid => {
      if (commonTree[hid]) {
        commonTree[hid].push(ma)
      } else {
        commonTree[hid] = [ma]
      }
    })
  }

  for (let ctv in CTV) {
    if (commonTree[ctv]) {
      commonTree[ctv] = [
        ...CTV[ctv],
        ...commonTree[ctv]
      ]
    } else {
      commonTree[ctv] = CTV[ctv]
    }
  }

  return {
    idStyle: idTree,
    utilStyle: commonTree,
    tree: {
      idTree,
      commonTree,
      CTV,
    },
    helper: {
      treeMap: {
        SH, HS
      },
      attrLinkHash: {
        commonAttrTree: CT,
        idAttrTree: IDT,
      },
      miniMap: {
        utilAttrMiniMap: USM, hashCommonMiniAttr: STC, commonMiniAttrSets: CSL, utilMiniMap: MUS
      }
    }
  }
}

const K = 1

function str2num(v, K, F) {
  let s = parseFloat(v)

  return Number.isNaN(s) ? v : s / K
}

function floatSides(calc, key, K, F, unit = '') {
  if (calc[key].endsWith(unit)) return

	if (typeof calc[key] == 'string') {
		let CV = calc[key].split(' ').map(v => str2num(v, K, F) + unit)

		if (CV.length > 1) {
			calc[key] = CV.join(' ')
		} else {
			calc[key] = CV[0]
		}
	}
}

const useSides = ['padding', 'margin', 'borderRadius', 'borderWidth']

// Considering the performance factor, the source object is modified directly without copying.
function px2any(obj, unit = 'px') {
  if (unit == 'px') return obj

  for (let key in obj) {
    let V = obj[key]
    let K = 1
    let F = 1

    if (unit == 'rem') {
      K = 50
      F = 2
    }

    if (unit == 'rpx') {
      K = 0.5
      F = 1
    }

    if (useSides.includes(key)) {
      floatSides(obj, key, K, F, unit)
    } else {
      if (/[0-9]px$/.test(V)) {
        let CV = ((parseFloat(V) / K).toFixed(F) + unit).replace('.00', '')
  
        if (CV == '0' + unit) {
          CV = '0'
        }
  
        obj[key] = CV
      }
    }
  }
}

function hump2Line(name) {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function line2Hump(name) {
  return name.replace(/\-(\w)/g, function (all, letter) {
    return letter.toUpperCase()
  })
}

function genSingleStyleContent(style, type = 'normal') {
  let css = Object.entries(style).map(arr => {
    let [k, v] = arr
    let [id, I] = k.split('|')

    return [`.${id}_${I}`, v]
  })
  switch (type) {
    case 'min':
      return css.map(kv => {
        let [k, v] = kv

        v = v.join(';')

        return `${k}{${v}};`
      }).join('')
      break
    case 'normal':
      return css.map(kv => {
        let [k, v] = kv

        v = v.join(';\n\t')

        return `${k} {
  ${v}
}`
      }).join('\n')
      break

    default:
      break
  }
}

function genUtilStyleContent(style, type = 'normal') {
  switch (type) {
    case 'min':
      return Object.entries(style).map(arr => {
        let [k, v] = arr
        
        v = v.replace(/\: /g, ':') // eg: 'top: 0.84rem;top: 10.84rem;' => "top:0.84rem;top:10.84rem;"
        return `.${k}{${v};}`
      }).join('')
      break
    case 'normal':
      return Object.entries(style).map(arr => {
        let [k, v] = arr
    
        return `.${k} { ${v}; }`
      }).join('\n')
      break

    default:
      return css.join('')
      break
  }
}

exports.genRootTreeStyle = function (tree, type = 'px') {
  let tdata = genStyle(tree, type)

  return {
    singleStyleContent: genSingleStyleContent(tdata.idStyle, 'normal'),
    utilStyleContent: genUtilStyleContent(tdata.helper.miniMap.utilMiniMap, 'normal'),
    styleMap: tdata.utilStyle
  }
}

exports.genTreeStyle = genStyle
exports.genSingleStyleContent = genSingleStyleContent
exports.px2any = px2any