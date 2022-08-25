/* eslint-disable no-async-promise-executor */
import fs from 'fs'
import download from 'download'
import { mkdir } from './helper'

const reg_filename = /(.*\/)*(.+)/
const REGEXP_URL = /^([a-z][a-z\d+\-.]*:)?\/\//i
const assetsPath = './assets/'
const FontCDN = 'https://static.iofod.com/'

type ExternalObj = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const assetsList: string[] = []
const FontList = {}
const entryList: ExternalObj[] = []
const innerEntryList: string[] = []
const externalList: ExternalObj[] = []

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
  const bgi = obj['backgroundImage']
  if (bgi && bgi.startsWith('url(')) {
    let url = ''

    const selected = bgi.match(/url\((.+)\)/)

    if (selected) {
      url = selected[1].replace(/"/g, '')
    }

    if (!url.startsWith(assetsPath)) {
      if (REGEXP_URL.test(url)) {
        assetsList.push(url)

        const filename = getFileName(url)
        const newUrl = usePath ? assetsPath + filename : filename

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
    const { value } = obj.url

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
            const filename = getFileName(arr[index])

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
          const filename = getFileName(value)

          obj.url.value = usePath ? assetsPath + filename : filename
        } catch (e) {
          console.log(value, reg_filename, e)
        }
      }
    }
  }
}

function parserExternal(str) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let url: any = ''

  try {
    url = new URL(str)
  } catch (e) {
    if (url.startsWith('//')) {
      url = 'https:' + url
    }
  }

  const dir = url.hostname
  const portStr = url.port ? url.port + '.' : ''
  const filename =
    portStr +
    url.pathname
      .split('/')
      .filter((e) => e)
      .join('.')

  return {
    url: str,
    dir,
    filename,
  }
}

function localizExternals(externals) {
  const obj = {}

  for (const key in externals) {
    const exObj = parserExternal(externals[key])

    externalList.push(exObj)

    obj[key] = exObj.filename
  }

  return obj
}

function localizModules(obj) {
  if (!obj.entry) return

  const { value } = obj.entry

  if (!value) return

  if (Array.isArray(value)) {
    entryList.push(
      ...value
        .toString()
        .split(',')
        .filter((v) => REGEXP_URL.test(v))
        .map((v) => parserExternal(v))
    )

    traverseArray(value, (arr, index) => {
      if (REGEXP_URL.test(arr[index])) {
        arr[index] = parserExternal(arr[index]).filename
      }

      if (arr[index].startsWith('@UT/')) {
        innerEntryList.push(arr[index])
      }
    })
  } else {
    if (REGEXP_URL.test(value)) {
      const exObj = parserExternal(value)

      entryList.push(exObj)

      obj.entry.value = exObj.filename
    }

    if (value.startsWith('@UT/')) {
      innerEntryList.push(value)
    }
  }
}

function downloadAssets(getAssetsPath) {
  return Promise.all(
    [...new Set(assetsList)]
      .filter((e) => e)
      .map((url) => {
        return new Promise(async (done) => {
          const filename = getFileName(url)
          const road = getAssetsPath(filename)

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
          const road = getAssetsPath(name + '.' + type)

          if (fs.existsSync(road)) return done(true)

          console.log('Download...', name)

          const url = `${FontCDN}fonts/${name}.${type}`

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
    entryList.map((obj) => {
      const { dir, filename, url } = obj

      return new Promise(async (done) => {
        const road = getEntrysPath(dir + '/' + filename)

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
    externalList.map((obj) => {
      const { dir, filename, url } = obj

      return new Promise(async (done) => {
        const road = getExternalsPath(dir + '/' + filename)

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

export {
  localizImage,
  localizModel,
  downloadAssets,
  downloadFonts,
  FontList,
  FontCDN,
  entryList,
  innerEntryList,
  externalList,
  setIFTarget,
  localizModules,
  parserExternal,
  localizExternals,
  downloadEntrys,
  downloadExternals,
}
