import path from 'path'
import {
  FontList,
  downloadAssets,
  downloadFonts,
  setIFTarget,
  downloadEntrys,
  downloadExternals,
} from '../common/downloadAssets'
import { cleanWriteMap } from '../common/helper'
import { IFstruct } from '../common/IFstruct'
import { IF } from './_env'

const getAssetsPath = (road) => path.resolve(`./public/assets/` + road)
const getEntrysPath = (road) => path.resolve(`./src/externals/` + road)
const getExternalsPath = (road) => path.resolve(`./public/lib/` + road)

export async function initData(payload, config) {
  const { cache, selected, useRemote } = config

  IF.ctx = new IFstruct(payload)
  IF.useRemote = useRemote

  if (!cache) cleanWriteMap()

  if (selected.includes('PC')) {
    IF.planform = 'pc'
    IF.unit = 'px'
  }

  if (selected.includes('Vue3')) {
    IF.framework = 'Vue3'
  }

  setIFTarget(IF.target)

  await main()

  return true
}

import { genPages } from './_genPage'
import { genRoutes } from './_genRoutes'
import { genStore } from './_genStore'
import { genScript } from './_genScript'
import { genExternals } from './_genExternals'
import { genInjectCSS } from './_genInjectCSS'
import { genIA } from './_genIA'

async function main() {
  console.time('gen')

  const { gft } = IF.ctx.Config.setting

  if (gft) FontList[gft] = true

  genPages()
  genRoutes()
  genStore()
  genScript()
  genExternals()
  genInjectCSS()

  if (!IF.useRemote) {
    await downloadAssets(getAssetsPath)
    await downloadFonts(getAssetsPath, 'woff')
  }

  await downloadEntrys(getEntrysPath)
  await downloadExternals(getExternalsPath)

  genIA()

  console.timeEnd('gen')
  console.log('Done!')
}
