import { setCTX, runCases } from './index'
import Taro from '@tarojs/taro'

function runCasesCallback(res) {
  Taro.sendSocketMessage({
    data: JSON.stringify({
      type: 'CALLBACK',
      payload: res
    })
  })
}

function createListener() {
  let url = process.env.AutoWebsocketUrl

  Taro.connectSocket({ url })
  Taro.onSocketOpen(function (res) {
  })
  Taro.onSocketMessage(function (res) {
    const { type, payload } = JSON.parse(res.data)

    if (type === 'START_AUTO') {
      setCTX(payload)

      setTimeout(() => {
        runCases(payload.item)
      }, 1000)
    }
  })
  Taro.onSocketError(function (res){
    console.log('WebSocket连接打开失败，请检查！')
  })
  Taro.onSocketClose(function (res) {
    console.log('WebSocket 已关闭！')
  })
}

export { runCasesCallback, createListener }
