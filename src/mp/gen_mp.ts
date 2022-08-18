import { FontList, setIFTarget } from '../common/downloadAssets'
import { cleanWriteMap } from '../common/helper'
import { IFstruct } from '../common/IFstruct'
import { IF } from './_env'

export async function initData(payload, config) {
  const { cache } = config

  IF.ctx = new IFstruct(payload)

  if (!cache) cleanWriteMap()

  setIFTarget(IF.target)

  await main()

  return true
}

import { genPages } from './_genPage'
import { genRoutes } from './_genRoutes'
import { genStore } from './_genStore'
import { genScript } from './_genScript'
import { genInjectCSS } from './_genInjectCSS'
import { genExpsMap } from './_genExpsMap'
import { genIA } from './_genIA'

async function main() {
  console.time('gen')

  const { gft } = IF.ctx.Config.setting

  if (gft) FontList[gft] = true

  genPages()
  genRoutes()
  genStore()
  genScript()
  genInjectCSS()
  genExpsMap()
  genIA()

  console.timeEnd('gen')
  console.log('Done!')
}
