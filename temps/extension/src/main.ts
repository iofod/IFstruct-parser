import * as PLUS from 'iofod-sdk'

export async function main() {
  await PLUS.init({
    state: {},
    version: '1.0.0'
  })

  await PLUS.render([])
}