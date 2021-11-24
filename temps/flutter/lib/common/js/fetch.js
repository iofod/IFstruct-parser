const uuid = () => {
  const S4 = () =>
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  return (
    S4() +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    S4() +
    S4()
  )
}

const psId = {}
const psFn = {}
const now = () => Date.now()

const PS = {
  subscribe(topic, callback) {
    if (!psId[topic]) {
      psId[topic] = now()
      psFn[topic] = [callback]
    } else {
      psFn[topic].push(callback)
    }

    return {
      'topic': topic,
      'index': psFn[topic].length - 1
    }
  },
  subscribeOnce(topic, callback) {
    let sid = {}

    sid = PS.subscribe(topic, value => {
      callback(value)
      PS.unsubscribe(sid)
    })
  },
  publish(topic, data) {
    setTimeout(() => {
      PS.publishSync(topic, data)
    }, 16)
  },
  publishSync(topic, data) {
    var fns = psFn[topic]
    
    log('publishSync: ' + topic)
    log(data)

    if (Array.isArray(fns)) {
      fns.forEach(fn => {
        if (typeof fn == 'function') {
          fn(data)
        }
      })
    }
  },
  unsubscribe(id, isSync = false) {
    if (typeof id == 'object') {
      var index = id['index']
      var topic = id['topic']

      if (isSync) {
        psFn[topic][index] = undefined

        if (psFn[topic].length < 1) {
          psId[topic] = null
          psFn[topic] = null
        }
      } else {
        setTimeout(() => {
          psFn[topic][index] = undefined
          if (psFn[topic].length < 1) {
            psId[topic] = null
            psFn[topic] = null
          }
        }, 0)
      }
    }
    if (typeof id == 'string' && psId[id] != null) {
      psId[id] = null
      psFn[id] = null
    }
  }
}

window.PS = PS

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    let token = uuid();
    PS.subscribeOnce(token, (data) => {
      resolve(data);
    });
    proxyFetch(token, url, options)
  })
}

function setTimeout(fn, time) {
  let token = uuid();
  PS.subscribeOnce(token, (data) => {
    fn();
  });
  proxySetTimeout(token, time);
}