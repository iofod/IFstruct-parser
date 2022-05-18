import 'package:flutter/foundation.dart';
// ignore: depend_on_referenced_packages
import 'package:js/js.dart';
import './FN.dart';
import './UT.dart';
import './SDK.dart';

@JS('eval')
external eval(String eval);

@JS('bridgeExec')
external set _bridgeExec(f);

@JS()
external void bridgeExec();

void initPolyfill() {
  String polyfill = '''
const Obj2URL = o => {
  return Object.keys(o)
    .map(e => e + '=' + o[e])
    .join('&')
}

async function ajax(url, options = {}) {
  let { data, params = {}, responseType = 'text' } = options

  delete options.data
  delete options.params

  if (data) {
    options.body = options.data
  }
  
  let arg = Obj2URL(params)

  if (arg) {
    url += url.includes('&') ? arg : ((url.includes('?') ? '&' : '?') + arg)
  }

  try {
    let res = await fetch(url, options)
    let body = await res[responseType]()
    let headers = {}

    res.headers.forEach((V, K) => headers[K] = V)

    return {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      headers,
      data: body
    }
  } catch (e) {
    console.error(e)
  }
}

SDK.AJAX = ajax
  ''';
  eval(polyfill);
}

bridgeExecHandle(String topic, [data]) {
  if (topic == 'CC:') {
    return SDK.call(data);
  }
  if (topic == 'JS:') {
    return SDK.emit(data);
  }
}

void initEval() {
  if (kDebugMode) {
    print('isWeb $isWeb');
  }
  _bridgeExec = allowInterop(bridgeExecHandle);
  SDK.init();
  initUT();
  initPolyfill();
}