/* eslint-disable prefer-const */
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
  'justify-self': 'js',
}

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

  display: 'd',

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

  ...flexMap,
}

const mapHL = {
  h2l: hump2Line,
  l2h: line2Hump,
}

// for json
function humpLineObj(obj, type = 'h2l') {
  const fn = mapHL[type]
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

  return name
    .split('-')
    .map((v) => v.substr(0, 1) + v.substr(-1, 1))
    .join('')
}

function zipAttr(name, l = 1) {
  if (humpAttrMap[name]) {
    return humpAttrMap[name]
  }

  return name.toLocaleUpperCase().substr(0, l)
}

// Considering the performance factor, the source object is modified directly without copying.
function px2any(obj, unit = 'px') {
  if (unit == 'px') return obj

  for (const key in obj) {
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

    if (typeof V != 'string') continue
    if (V.startsWith('# ')) continue

    V = V.replace(/(-)?(0.)?\d+px/g, function (exp) {
      return ((parseFloat(exp.slice(0, -2)) / K).toFixed(F) + unit).replace(
        '.00',
        ''
      )
    })

    obj[key] = V
  }

  return obj
}

function hump2Line(name) {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function line2Hump(name) {
  return name.replace(/-(\w)/g, function (_all, letter) {
    return letter.toUpperCase()
  })
}

export { miniAttr, zipAttr, px2any }
