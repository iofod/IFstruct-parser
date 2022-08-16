const fs = require('fs')
const download = require('download')
const { mkdir } = require('./helper')

const reg_filename = /(.*\/)*(.+)/
const REGEXP_URL = /^([a-z][a-z\d\+\-\.]*:)?\/\//i
const assetsPath = './assets/'
const FontCDN = 'https://static.iofod.com/'

const assetsList = []
const FontList = {}
const entryList = []
const externalList = []

let IFtarget = 'web'

function getFileName(url) {
  let str = url.split('?')[0]

  if (!str) return ''

  str = str.match(reg_filename)[2]

  if (IFtarget == 'web') {
    return str.replaceAll(' ', '_').replaceAll('%20', '_') // replace %20 to _
  }

  return str.replaceAll(' ', '%20')
}

function localizImage(obj, usePath = true) {
  let bgi = obj['backgroundImage']
  if (bgi && bgi.startsWith('url(')) {
    let url

    let selected = bgi.match(/url\((.+)\)/)

    if (selected) {
      url = selected[1].replace(/"/g, '')
    }

    if (!url.startsWith(assetsPath)) {
      if (REGEXP_URL.test(url)) {
        assetsList.push(url)

        let filename = getFileName(url)
        let newUrl = usePath ? assetsPath + filename : filename

        obj['backgroundImage'] = `url(${newUrl})`
      }
    }
  }
}

function traverseArray(arr, callback) {
  arr.forEach((item, index) => {
    if (Array.isArray(item)) {
      traverseArray(item, callback)
    } else {
      callback(arr, index)
    }
  })
}

function localizModel(obj, usePath = true) {
  if (obj.url) {
    let { value } = obj.url

    if (!value) return

    if (Array.isArray(value)) {
      assetsList.push(
        ...value
          .toString()
          .split(',')
          .filter((v) => REGEXP_URL.test(v))
      )

      traverseArray(value, (arr, index) => {
        let src

        if (REGEXP_URL.test(arr[index])) {
          try {
            let filename = getFileName(arr[index])

            src = usePath ? assetsPath + filename : filename
          } catch (error) {
            console.log(error)
            src = ''
          }
          arr[index] = src
        }
      })
    } else {
      if (REGEXP_URL.test(value)) {
        assetsList.push(value)

        try {
          let filename = getFileName(value)

          obj.url.value = usePath ? assetsPath + filename : filename
        } catch (e) {
          console.log(value, reg_filename, e)
        }
      }
    }
  }
}

function parserExternal(str) {
  let url = new URL(str)

  let dir = url.hostname
  let portStr = url.port ? (url.port + '.') : ''
  let filename = portStr + url.pathname.split('/').filter(e => e).join('.')

  return {
    url: str, dir, filename
  }
}

function localizExternals(externals) {
  let obj = {}

  for (let key in externals) {
    let exObj = parserExternal(externals[key])

    externalList.push(exObj)

    obj[key] = exObj.filename
  }

  return obj
}

function localizModules(obj) {
  if (!obj.entry) return

  let { value } = obj.entry

  if (!value) return

  if (Array.isArray(value)) {
    entryList.push(
      ...value
        .toString()
        .split(',')
        .filter((v) => REGEXP_URL.test(v)).map(v => parserExternal(v))
    )

    traverseArray(value, (arr, index) => {
      if (REGEXP_URL.test(arr[index])) {
        arr[index] = parserExternal(arr[index]).filename
      }
    })
  } else {
    if (REGEXP_URL.test(value)) {
      let exObj = parserExternal(value)

      entryList.push(exObj)

      obj.entry.value = exObj.filename
    }
  }
}

function downloadAssets(getAssetsPath) {
  return Promise.all(
    [...new Set(assetsList)]
      .filter((e) => e)
      .map((url) => {
        return new Promise(async (done) => {
          let filename = getFileName(url)
          let road = getAssetsPath(filename)

          if (fs.existsSync(road) || !REGEXP_URL.test(url)) return done(true)

          console.log('Download...', url)

          // Save locally
          try {
            fs.writeFileSync(road, await download(url))
          } catch (e) {
            console.error(e)
          }

          done(true)
        })
      })
  )
}

function downloadFonts(getAssetsPath, type = 'ttf') {
  return Promise.all(
    Object.keys(FontList)
      .filter((e) => e)
      .filter((name) => name != 'inherit' && name)
      .map((name) => {
        return new Promise(async (done) => {
          let road = getAssetsPath(name + '.' + type)

          if (fs.existsSync(road)) return done(true)

          console.log('Download...', name)

          let url = `${FontCDN}fonts/${name}.${type}`

          try {
            await download(url, getAssetsPath(''))
          } catch (e) {
            console.error(e)
          }

          done(true)
        })
      })
  )
}

function downloadEntrys(getEntrysPath) {
  return Promise.all(
    entryList
      .map((obj) => {
        let { dir, filename, url } = obj

        return new Promise(async (done) => {
          let road = getEntrysPath(dir + '/' + filename)

          if (fs.existsSync(road)) return done(true)

          console.log('Download Entrys...', url)

          await mkdir(`externals/${dir}`)

          // Save locally
          try {
            fs.writeFileSync(road, await download(url))
          } catch (e) {
            console.error(e)
          }

          done(true)
        })
      })
  )
}

function downloadExternals(getExternalsPath) {
  return Promise.all(
    externalList
      .map((obj) => {
        let { dir, filename, url } = obj

        return new Promise(async (done) => {
          let road = getExternalsPath(dir + '/' + filename)

          if (fs.existsSync(road)) return done(true)

          console.log('Download Externals...', url)

          await mkdir(getExternalsPath(dir), false)

          // Save locally
          try {
            fs.writeFileSync(road, await download(url))
          } catch (e) {
            console.error(e)
          }

          done(true)
        })
      })
  )
}

function setIFTarget(type) {
  IFtarget = type
}

exports.localizImage = localizImage
exports.localizModel = localizModel
exports.downloadAssets = downloadAssets
exports.downloadFonts = downloadFonts
exports.FontList = FontList
exports.FontCDN = FontCDN
exports.entryList = entryList
exports.externalList = externalList
exports.setIFTarget = setIFTarget
exports.localizModules = localizModules
exports.parserExternal = parserExternal
exports.localizExternals = localizExternals
exports.downloadEntrys = downloadEntrys
exports.downloadExternals = downloadExternals
