import 'package:flutter/foundation.dart';
import 'package:flutter_qjs/flutter_qjs.dart';
import 'package:myapp/common/FN.dart';
import './UT.dart';
import './SDK.dart';

eval(String eval) {
  return javascriptRuntime.evaluate(eval);
}

final javascriptRuntime = FlutterQjs(
  stackSize: 1024 * 1024 * 5, // change stack size here.
);

void initPolyfill() {
  String polyfill = '''
function setTimeout(fn, time) {
  let token = uuid();
  PS.subscribeOnce(token, (data) => {
    fn();
  });
  proxySetTimeout(token, time);
}

SDK.AJAX = function(url, options = {}) {
  return bridgeExec('CC:', JSON.stringify({
    method: 'AJAX',
    payload: { url, options }
  }))
}
  ''';
  eval(polyfill);
}

void initEval() {
  javascriptRuntime.dispatch();
  SDK.init();
  initPolyfill();
  initUT();

  final setToGlobalObject =
      javascriptRuntime.evaluate("(key, val) => { this[key] = val; }");
  setToGlobalObject.invoke([
    "log",
    (msg) {
      if (kDebugMode) {
        print(msg);
      }
    }
  ]);
  setToGlobalObject.invoke([
    "bridgeExec",
    (topic, [data]) {
      if (topic == 'CC:') {
        return SDK.call(data);
      }
      if (topic == 'JS:') {
        return SDK.emit(data);
      }
    }
  ]);
  setToGlobalObject.invoke([
    'proxySetTimeout',
    (token, time) async {
      setTimeout(() {
        eval('PS.publish("$token", "")');
      }, time);
    }
  ]);

  setToGlobalObject.free();
}
