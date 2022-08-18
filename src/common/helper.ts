/* eslint-disable no-prototype-builtins */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import Diff from 'universal-diff'
const getPath = (road: string) => path.resolve(`./src/` + road)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function format(content, _ = 'js') {
  return content
}

// No caching for specific paths here, special for ESM-based build tools like vite,
// no problem for dependency graph-based ones like webpack.
function isNocache(key) {
  if (key.includes(`router`)) return true

  return false
}

let WriteMap = {}

function writeIn(road, content) {
  const hash = crypto.createHash('md5').update(content).digest('hex')

  if (WriteMap[road] != hash || isNocache(road)) {
    WriteMap[road] = hash

    fs.writeFileSync(road, content)
    console.log('Write:', road)
  }
}

function cleanWriteMap() {
  WriteMap = {}
}

function mergeDiff(value, diff) {
  diff = diff || []

  value = Diff.mergeStr(value, {
    splitter: '',
    diff: diff,
  })

  return value
}

function getLayout(tag = 'default|1200') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, L] = tag.split('|')
  if (tag.includes('pclr')) {
    return {
      width: 'calc(100% - ' + L + 'px)',
      'margin-left': L + 'px',
    }
  } else if (tag.includes('fone')) {
    return {
      width: '100%',
      'min-width': L + 'px',
    }
  } else {
    return {
      width: L + 'px',
    }
  }
}

const mkdir = (road, prefix = true) => {
  return new Promise((done) => {
    fs.mkdir(prefix ? getPath(road) : road, { recursive: true }, (err) => {
      if (err) {
        console.log(err)
        done(err)
      }
      done(true)
    })
  })
}

function genArray(num) {
  return Array(num).fill(0)
}

// Circular dimension mapping, L is level exclusive, after which incremental,
// theoretically can be incremental to Z, but the actual application is actually I, J, K, will not go further.
const DIMap = {
  0: '',
  1: 'I',
  2: 'J',
  3: 'K',
  4: 'L',
  5: 'M',
  6: 'N',
  7: 'O',
  8: 'P',
  9: 'Q',
  10: 'R',
  11: 'S',
}

function getCloneMark(DI) {
  return genArray(DI).map((_, I) => DIMap[I + 1]) // DI=3 =>  [I, J, K]
}

const diffProps = (op, np) => {
  const obj = {}

  if (!op || !np) return obj

  for (const key in np) {
    if (!op.hasOwnProperty(key) || op[key] != np[key]) {
      obj[key] = np[key]
    }
  }

  return obj
}

const diffState = (os, ns) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ap: any = {} //animateProp
  const op = os.props
  const np = ns.props

  if (np.x != op.x) ap.left = np.x
  if (np.y != op.y) ap.top = np.y
  if (np.d != op.d) ap.rotate = np.d

  if (np.option.V != op.option.V)
    ap.visibility = np.option.V ? 'visible' : 'hidden'

  const props = Object.assign(
    ap,
    diffProps(op.style, np.style),
    diffProps(op.option.customKeys, np.option.customKeys)
  )

  return props
}

// No transformation for specific model variables
const parseExclude = ['$response', '$N', '$odd', '$even', '$n']

function genExp(exp, str = 'FN.parseModelStr') {
  const expList = exp.match(/\$\w+(-\w+)?(<.+?>)?/g) || []

  expList.forEach((mds) => {
    // The $response in the expression uses the variable directly.
    if (mds == '$response') {
      exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${mds.substring(1)}`)
    } else {
      exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${str}('${mds}', e.hid)`)
    }
  })

  return exp
}

const writeResponseList = ['function', 'service'] // For processing built-in responses.
const Gesture = [
  'tap',
  'longtap',
  'swipe',
  'swipeleft',
  'swiperight',
  'swipeup',
  'swipedown',
  'pressmove',
  'rotate',
  'pinch',
  'start',
  'end',
]

const FilterDefault =
  'contrast(100%) brightness(100%) saturate(100%) sepia(0%) grayscale(0%) invert(0%) hue-rotate(0deg) blur(0px)'.split(
    ' '
  )

function clearDefaultProperty(style) {
  ;['filter', 'backdropFilter'].forEach((key) => {
    if (style[key]) {
      FilterDefault.forEach((dv) => {
        style[key] = style[key].replace(dv, '').replace(dv, '')
      })

      style[key] = style[key].replace('  ', '').trim()
    }
  })

  return style
}

function fixHSS(obj) {
  const { status } = obj

  status.forEach((statu) => {
    const { props } = statu
    const { x, y, style } = props
    const isMeta = !statu.name.includes(':') && statu.name != '$mixin'

    props.x = x || (isMeta ? 0 : x)
    props.y = y || (isMeta ? 0 : y)

    clearDefaultProperty(style)
  })

  return obj
}

function processReplacement(str, hid) {
  return str
    .replace(/\$current(?![_a-zA-Z])/g, hid)
    .split('\n')
    .join('\n\t\t\t')
    .replace('"__R__', '')
    .replace('__R__"', '')
}

export {
  format,
  writeIn,
  cleanWriteMap,
  mergeDiff,
  getLayout,
  getPath,
  mkdir,
  getCloneMark,
  diffState,
  parseExclude,
  genExp,
  writeResponseList,
  Gesture,
  DIMap,
  fixHSS,
  clearDefaultProperty,
  processReplacement,
}
