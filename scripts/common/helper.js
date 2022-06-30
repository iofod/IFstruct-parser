const fs = require('fs')
const path = require('path')
const prettier = require('prettier')
const crypto = require('crypto')
const Diff = require('universal-diff')
const getPath = (road) => path.resolve(`./src/` + road)
const parser = {
  js: 'babel',
  vue: 'vue',
}

function format(content, type = 'js') {
  return content
  // return prettier.format(content, { semi: false, parser: parser[type] || type })
}

// No caching for specific paths here, special for ESM-based build tools like vite,
// no problem for dependency graph-based ones like webpack.
function isNocache(key) {
  if (key.includes(`router`)) return true

  return false
}

let WriteMap = {}

function writeIn(road, content) {
  let hash = crypto.createHash('md5').update(content).digest('hex')

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
  let [_, L] = tag.split('|')
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

const mkdir = (road) => {
  return new Promise((done) => {
    fs.mkdir(getPath(road), { recursive: true }, (err) => {
      if (err) {
        console.log(err)
        done(err)
      }
      done()
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
  let obj = {}

  if (!op || !np) return obj

  for (let key in np) {
    if (!op.hasOwnProperty(key) || op[key] != np[key]) {
      obj[key] = np[key]
    }
  }

  return obj
}

const diffState = (os, ns) => {
  let ap = {} //animateProp
  let op = os.props
  let np = ns.props

  if (np.x != op.x) ap.left = np.x
  if (np.y != op.y) ap.top = np.y
  if (np.d != op.d) ap.rotate = np.d

  if (np.option.V != op.option.V) ap.visibility = np.option.V ? 'visible' : 'hidden'

  let props = Object.assign(
    ap,
    diffProps(op.style, np.style),
    diffProps(op.option.customKeys, np.option.customKeys)
  )

  return props
}

// No transformation for specific model variables
const parseExclude = ['$response', '$N', '$odd', '$even', '$n']

function genExp(exp, str = 'FN.parseModelStr') {
  let expList = exp.match(/\$\w+(-\w+)?(<.+?>)?/g) || []

  expList.forEach((mds) => {
    // The $response in the expression uses the variable directly.
    if (mds == '$response') {
      exp = exp.replace(new RegExp('\\' + mds, 'gm'), `${mds.substr(1)}`)
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

String.prototype.replaceAll = function (s1, s2) {
  return this.replace(new RegExp(s1, 'gm'), s2)
}

function fixHSS(obj) {
  let { status } = obj

  status.forEach((statu) => {
    let { props } = statu

    let { x, y, d, s } = props

    let isMeta = !statu.name.includes(':') && statu.name != '$mixin'

    props.x = x || (isMeta ? 0 : x)
    props.y = y || (isMeta ? 0 : y)
    props.d = d
    props.s = s
  })

  return obj
}

exports.format = format
exports.writeIn = writeIn
exports.cleanWriteMap = cleanWriteMap
exports.mergeDiff = mergeDiff
exports.getLayout = getLayout
exports.getPath = getPath
exports.mkdir = mkdir
exports.getCloneMark = getCloneMark
exports.diffState = diffState
exports.parseExclude = parseExclude
exports.genExp = genExp
exports.writeResponseList = writeResponseList
exports.Gesture = Gesture
exports.DIMap = DIMap
exports.fixHSS = fixHSS
