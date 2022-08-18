import path from 'path'
import { IFstruct } from '../common/IFstruct'
import { IF } from './_env'
import { cleanWriteMap } from '../common/helper'
import {
  FontList,
  downloadAssets,
  downloadFonts,
  setIFTarget,
} from '../common/downloadAssets'
import { genPages } from './_genPage'
import { genRoutes } from './_genRoutes'
import { genStore } from './_genStore'
import { genScript } from './_genScript'
import { genEV } from './_genEV'
import { genInjectPubspec } from './_genInjectPubspec'
const getAssetsPath = (road) => path.resolve(`./assets/` + road)

async function initData(payload, config) {
  const { cache } = config

  IF.ctx = new IFstruct(payload)

  if (!cache) cleanWriteMap()

  setIFTarget(IF.target)

  await main()

  return true
}

async function main() {
  console.time('gen')

  const { gft } = IF.ctx.Config.setting

  if (gft) FontList[gft] = true

  genPages()
  genRoutes()
  genScript()
  genEV()
  genStore()

  await downloadAssets(getAssetsPath)
  await downloadFonts(getAssetsPath, 'ttf')

  genInjectPubspec()

  console.timeEnd('gen')
  console.log('Done!')
}

export { initData }
