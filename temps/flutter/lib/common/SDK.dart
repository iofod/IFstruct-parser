import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import './FN.dart';
import './_sdk.dart';
import './FA.dart';

callGetMODEL(payload) {
  String hid = payload['hid'] ?? '';

  return FN.GET_MODEL(hid)(payload['key'] ?? '', payload['exp']);
}

callSetMODEL(payload) {
  String hid = payload['hid'] ?? '';

  return FN.SET_MODEL(hid)(payload['key'] ?? '', payload['value'], payload['exp']);
}

callFLOW(payload) {
  String table = payload['table'];
  Map data = payload['data'];

  updateFlow(table, data);
}

callGetSTATE(payload) {
  String hid = payload['hid'] ?? '';
  String name = payload['stateName'] ?? '';

  var selected = getStateByName(hid, name);
  var calc = {};

  if (selected != null) {
    selected.value['style'].value.forEach((K, V) {
      calc[K] = V;
    });
    selected.value['custom'].value.forEach((K, V) {
      calc[K] = V;
    });

    return jsonEncode(calc);
  }
}

callSetSTATE(payload) {
  String hid = payload['hid'] ?? '';
  String name = payload['stateName'] ?? '';
  Map obj = payload['obj'] ?? {};

  var selected = getStateByName(hid, name);
  var style = selected.value['style'];
  var custom = selected.value['custom'];

  if (selected != null) {
    obj.forEach((K, V) {
      if (style.value[K] != null) {
        style.value[K] = V;
      } else {
        custom.value[K] = V;
      }
    });
  }
}

callToggleSTATE(payload) {
  String hid = payload['hid'] ?? '';
  String name = payload['stateName'] ?? '';
  var state = getActiveMetaState(hid);
  var selected = getStateByName(hid, name);

  if (selected != null && state != null) {
    selected.value['active'] = true;
    state.value['active'] = false;
  }
}

callActivateSTATE(payload) {
  String hid = payload['hid'] ?? '';
  String name = payload['subStateName'] ?? '';

  var selected = getStateByName(hid, name);

  if (selected != null) {
    selected.value['active'] = true;
  }
}

callFrozenSTATE(payload) {
  String hid = payload['hid'] ?? '';
  String name = payload['subStateName'] ?? '';

  var selected = getStateByName(hid, name);

  if (selected != null) {
    selected.value['active'] = false;
  }
}

callRoutePUSH(payload) {
  String target = payload['target'] ?? '';
  Duration during = Duration(milliseconds: (payload['during'] ?? 0.0).round());
  String transition = payload['transition'] ?? 'fade';

  FN.ROUTE_PUSH(target, during, transition);
}

callTOAST(payload) {
  String message = payload['message'] ?? '';
  FA.alert(message);
}

callENV(payload) {
  if (isWeb) return ['web'];
  return [ isAndroid ? 'android' : (isIOS ? 'ios' : 'other') ];
}


final dio = Dio();

callAjax(payload) async {
  String url = payload['url'] ?? '';
  Map options = payload['options'];

  String resType = options['responseType'] ?? 'text';

  try {
    var body = options['body'] ?? {};
    var res = await dio.request(url,
        data: body, options: Options(method: options['method'] ?? 'GET'));

    Map header = {};

    res.headers.forEach((K, V) {
      header[K] = V.join(' ');
    });

    var data = res.data;

    switch(resType) {
      case 'text':
        if (data is! String) {
          data = data.toString();
        }
        break;
      case 'json':
        if (data is! Map && data is String) {
          data = jsonDecode(data);
        }
    }

    return {
      'url': res.realUri,
      'status': res.statusCode,
      'statusText': res.statusMessage,
      'headers': header,
      'data': data,
    };
  } catch (e) {
    if (kDebugMode) {
      print(e);
    }
  }
}

final methodMap = {
  'GET_MODEL': callGetMODEL,
  'SET_MODEL': callSetMODEL,
  'GET_STATE': callGetSTATE,
  'SET_STATE': callSetSTATE,
  'TOGGLE_STATE': callToggleSTATE,
  'ACTIVATE_STATE': callActivateSTATE,
  'FROZEN_STATE': callFrozenSTATE,
  'ROUTE_PUSH': callRoutePUSH,
  'TOAST': callTOAST,
  'ENV': callENV,
  'FLOW': callFLOW,
  'AJAX': callAjax
};

class SDK {
  static init() {
    evalJS(innerSDK);
  }
  static call(str) {
    var data = jsonDecode(str);
    var method = data['method'] ?? '';
    var payload = data['payload'];

    var fn = methodMap[method];
    var res;

    if (fn != null) {
      res = fn(payload);
    }

    return res;
  }
  static emit(str) {
    var data = jsonDecode(str);
    var token = data['token'] ?? '';
    var payload = data['payload'];

    PS.publishSync('JS:' + token, payload);
  }
}