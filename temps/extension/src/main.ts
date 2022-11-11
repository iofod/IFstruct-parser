import * as PLUS from 'iofod-sdk'

const { Button } = PLUS.components

export async function main() {
  await PLUS.init({
    state: {},
    version: '1.0.0'
  })

  await PLUS.render([
    Button('Hello World!')
  ])

  return
}
