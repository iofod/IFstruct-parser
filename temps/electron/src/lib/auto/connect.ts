import { setCTX, runCases } from './index'

let ws

function runCasesCallback(res) {
  if (ws) {
    ws.send(JSON.stringify({
      type: 'CALLBACK',
      payload: res
    }))
  }
}

function createListener() {
  let url = import.meta.env.VITE_AutoWebsocketUrl

  ws = new WebSocket(url)

  ws.onopen = _ => {
  }
  ws.onmessage = evt => {
    console.log('got: ', evt)

    const { type, payload } = JSON.parse(evt.data)

    if (type === 'START_AUTO') {
      setCTX(payload)

      setTimeout(() => {
        runCases(payload.item)
      }, 1000)
    }
  }
  ws.onerror = _ => {
    console.warn(url + 'error')

    ws = null
  }

  ws.onclose = _ => {
    console.warn(url + 'close')

    ws = null
  }
}

export { runCasesCallback, createListener }
