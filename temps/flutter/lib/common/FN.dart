import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'package:uuid/uuid.dart';
import 'dart:math' as math;
import 'package:flutter/scheduler.dart';
import 'package:rxdart/rxdart.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import '../store/index.dart';
import '../router.dart';
// import './js_web.dart'; // web debug mode
import './js_native.dart'; // native debug mode

part '_FN.dart';
part 'PS.dart';
part 'bezier.dart';
part 'mouse.dart';
part 'polyfill.dart';

bool isWeb = kIsWeb == true;
bool isAndroid = Platform.isAndroid;
bool isIOS = Platform.isIOS;

final evalJS = eval;
final initEvalJS = initEval;

Future tween({from = 0.0, to = 0.0, duration = 0.0, fn, easing}) {
  final com = Completer();
  final future = com.future;

  int t = 0;
  int d = (duration / 16.7).ceil(); // 30 frames per second.

  var step;

  step = ([_]) {
    double l = to - from;
    double p = t / d; // Progress

    p = double.parse((p > 0.0 && p < 1.0 ? easing.transformInternal(p) : p)
        .toStringAsFixed(2));

    t += 1;

    if (t <= d) {
      fn(from + l * p);
      requestAnimationFrame(step);
    } else {
      fn(to);

      com.complete('done');
    }
  };

  step();

  return future;
}

class FN {
  static Future sleep(ms) async {
    await Future.delayed(Duration(milliseconds: 1) * ms.round(), () {});

    return true;
  }

  static SETS(hid) {
    return $sets[hid];
  }

  static STATE(hid) {
    var $item = $sets[hid].value;
    var status = $item['status'].value;
    var arr =
        status.where((instance) => instance.value['active'] == true).toList();

    return arr[0];
  }

  static GET_MODEL(String hid) {
    return (K, [E]) {
      if (E == null) E = '\$N';

      var $item = $sets[hid].value;

      if ($item == null) {
        warn('target $hid is null');
        return [];
      }

      var $model = $item['model'].value[K];

      if ($model == null) return null;

      var V = $model.value['value'];

      ModelHandle(hid, K, $item);

      if (V == null) {
        return V;
      }

      return subExpFilter(E.split(':'), V, hid, 0);
    };
  }

  static SET_MODEL(hid) {
    return (K, V, [E, silent = false]) {
      if (E == null) E = '\$N';

      var $item = $sets[hid].value;

      if ($item == null) {
        warn('target $hid is null');
        return [];
      }

      var model = $item['model'].value[K];

      if (model == null) return null;

      if (E == 'force') {
        model.value['value'] = V;
      } else {
        if (V is List) {
          subExpWrite(E.split(':'), V, hid, 0, V, model, 0, K);
        } else {
          model.value['value'] = V;
        }
      }

      if (!silent) {
        PS.publish('$hid##$K.modelchange', V);
      }
    };
  }

  static ROUTE_PUSH(target, during, transition) async {
    if (during == null) during = 300;
    if (transition == null) transition = 'fade';

    await $router.navigateTo(target, during: during, type: transition, params: {});
  }
}

class GV {
  static T() {
    return DateTime.now().millisecondsSinceEpoch;
  }

  static uuid() {
    var uuid = Uuid();

    return uuid.v4();
  }
}

rafity(fn) {
  var aid;
  var done = false;

  var rfn;

  rfn = ([_]) {
    if (done) return;

    fn();

    aid = requestAnimationFrame(rfn);
  };

  return {
    'tick': rfn,
    'done': ([_]) {
      done = true;

      cancelAnimationFrame(aid);

      aid = null;
    }
  };
}

String joinArr(arr) {
  if (arr is List) {
    if (arr.length < 2) {
      return arrFirst(arr[0]);
    } else {
      return arr.toString();
    }
  } else {
    return arr;
  }
}

GET(config, String key) {
  var hid = config.hid;
  var clone = config.clone;
  var arr = FN.GET_MODEL(hid)(key, tfClone(clone));

  return parseModelExp(arr is List ? joinArr(arr) : arr, hid, false);
}

GET_(hid, clone, key) {
  var arr = FN.GET_MODEL(hid)(key, tfClone(clone));

  return parseModelExp(arr is List ? joinArr(arr) : arr, hid, false);
}

void UPDATE(config, String key, value, [silent = false]) {
  var hid = config.hid;
  var clone = config.clone;

  FN.SET_MODEL(hid)(key, value, tfClone(clone), silent);
}
