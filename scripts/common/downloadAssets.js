const fs = require('fs')
const download = require('download')
const reg_filename = /(.*\/)*(.+)/
const REGEXP_URL = /^([a-z][a-z\d\+\-\.]*:)?\/\//i
const assetsPath = './assets/'
const FontCDN = 'https://static.iofod.com/'

const assetsList = []
const FontList = {}

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
            await download(url, getAssetsPath(''))

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

function setIFTarget(type) {
  IFtarget = type
}

exports.localizImage = localizImage
exports.localizModel = localizModel
exports.downloadAssets = downloadAssets
exports.downloadFonts = downloadFonts
exports.FontList = FontList
exports.FontCDN = FontCDN
exports.setIFTarget = setIFTarget
