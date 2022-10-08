import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:myapp/components/auto/mockPointer.dart';
import 'dart:async';
import 'dart:math' as math;
import './FN.dart';
import '../store/index.dart';
import '../router.dart';
import './vdata.dart';
import './mixin.dart';
import './initView.dart';
import '../components/auto/index.dart';

part 'whileAsync.dart';

getActiveMetaState(hid) {
  var target = $sets[hid].value;

  if (target == null) {
    return warn(hid + 'target not find');
  }

  var filter = target['status'].value.where((state) {
    var value = state.value;

    return !value['name'].contains(':') && value['active'] && value['name'] != '\$mixin';
  });

  return filter.isEmpty ? null : filter.first;
}

getState(hid, id) {
  var curr = $sets[hid].value;
  var filter = curr['status'].value.where((statu) => statu.value['id'] == id.toString());
  return  filter.isEmpty ? null : filter.first;
}

getStateByName(hid, name) {
  var curr = $sets[hid].value;
  var filter = curr['status'].value.where((statu) => statu.value['name'] == name);
  return  filter.isEmpty ? null : filter.first;
}

setTransition(state, during, curve) {
  var style = state.value['style'];
  var oldValue = style.value['during'];
  var oldCurve = style.value['curve'];

  if (during > 0) {
    style.value['during'] = during;
    style.value['curve'] = curve;
  }

  setTimeout(() {
    style.value['during'] = oldValue;
    style.value['curve'] = oldCurve;
  }, during);
}

changeStatu(config) {
  var context = config['context'];
  var hid = context.hid;
  var target = config['target'];
  var state = config['state'];
  var stateA = config['stateA'];
  var stateB = config['stateB'];
  var during = config['during'];
  var curve = config['curve'];

  var realTarget = parseModelStr(target, hid);
  var curr = $sets[realTarget].value;
  var $status = curr['status'].value;

  var oldState;
  var newState;

  if (state != null) {
    oldState = getActiveMetaState(realTarget);

    var filter = $status.where((statu) => statu.value['id'] == state.toString()); // statu id is String

    newState = filter.isEmpty ? null : filter.first;
  }

  if (stateA != null && stateB != null) {
    var arr = $status.where((statu) {
      var id = statu.value['id'];

      return id == stateA.toString() || id == stateB.toString();
    }).toList();

    if (arr.length < 2) {
      arr.add(null);
    }

    var A = arr[0];
    var B = arr[1];

    if (A.value['active']) {
      oldState = A;
      newState = B;
    } else {
      oldState = B;
      newState = A;
    }

    if (!A.value['active'] && !B.value['active']) {
      oldState = getActiveMetaState(target);
      newState = A;
    }
  }

  setTransition(newState, during, curve);

  if (oldState != null) oldState.value['active'] = false;
  if (newState != null) newState.value['active'] = true;
}

changeSubState(config) {
  var context = config['context'];
  var hid = context.hid;
  var target = config['target'];
  var subState = config['subState'];
  var during = config['during'];
  var curve = config['curve'];
  var active = config['active'];

  var realTarget = parseModelStr(target, hid);

  if (subState != null) {
    var selected = getState(realTarget, subState);

    if (selected != null) {
      setTransition(selected, during, curve);
      selected.value['active'] = active;
    }
  }
}

setStatuValue(config) {
  var context = config['context'];
  var hid = context.hid;
  var target = config['target'];
  var state = config['state'];
  var key = config['key'];
  var value = config['value'];

  var realTarget = parseModelStr(target, hid);

  if (state != null) {
    var selected = getState(realTarget, state);

    if (selected != null) {
      selected.value['style'].value[key] = value is String ? double.parse(value) : value;
    }
  }
}

class FA {
  static alert(msg) async {
    if (kDebugMode) {
      print(msg);
    }

    Fluttertoast.showToast(
      msg: msg.toString(),
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.CENTER,
      backgroundColor: Colors.red,
      textColor: Colors.white,
      fontSize: 16.0
    );
  }
  static router(config) async {
    var target = config['target'];

    if (target == null || $currentContextPage == target) return false; // no repeat

    var replace = config['replace'];
    var during = Duration(milliseconds: config['during'].round() ?? 0);
    var type = config['transition'];

    routerFlying = true;

    setTimeout(() {
      routerFlying = false;
    }, 500);

    PS.publish('routechange', {
      'from': $context.state.pid,
      'to': target
    });

    if (replace == true) {
      $contextList.removeAt($contextList.length - 1);

      return await $router.navigateTo(target, replace: true, during: during, type: type, params: {});
    }

    return await $router.navigateTo(target, during: during, type: type, params: {});
  }
  static routerGo(param) async {
    // ignore: avoid_print
    if (param > 0) return print('$param is invalid');

    PS.publish('FA_routerGo', param);

    var from = $context.state.pid;
    var res = await $router.navigateBack(param * -1, true);

    PS.publish('routechange', {
      'from': from,
      'to': $context.state.pid,
    });

    setTimeout(() {
      setStatusBar(from);
    }, 17);

    return res;
  }
  static statuToggle(config) {
    return changeStatu(config);
  }
  static statu(config) {
    return changeStatu(config);
  }
  static activateStatu(config) {
    config['active'] = true;

    return changeSubState(config);
  }
  static frozenStatu(config) {
    config['active'] = false;

    return changeSubState(config);
  }
  static timeout(param) async {
    return await FN.sleep(param);
  }
  static setModel(config) {
    var target = config['target'];
    var key = config['key'];
    var exp = config['exp'];
    var value = config['value'];

    if (target is! String) return warn('$target is invalid');
    if (key is! String) return warn('$key is invalid');

    if (value == 'false') value = false;
    if (value == 'true') value = true;

    FN.SET_MODEL(target)(key, value, exp.split(':').map((v) => '\$' + v).toList().join(':'));
  }
  static getModel(config) {
    var target = config['target'];
    var key = config['key'];
    var exp = config['exp'];

    if (target is! String) return warn('$target is wrong');
    if (key is! String) return warn('$key is wrong');

    var arr = FN.GET_MODEL(target)(key, exp.split(':').map((v) => '\$' + v).toList().join(':'));

    arr = arrFirst(arr);

    return arr;
  }
  static getIndex(ctx) {
    return ctx.index;
  }
  static animate() {
  }
  static animateCommand() {
  }
  static animateProgress() {
  }
  static Future useInteractionFlow(config) {
    var target = config['target'];
    var hid = config['hid'];
    var state = config['state'];
    var key = config['key'];
    var fn = config['exp'];
    var map = config['map'];
    var isAsync = config['async'];

    var isState = state != null && state != '';
    var style;

    double ov = 0.0;

    var ME;

    if ($Global.value['useRunCases']) {
      ME = playMouseRecord(($Global.value['previewEventMap'])[hid]);
    } else {
      ME = MOUSE;
    }

    if (isState) {
      var selected = getState(target, state);

      style = selected.value['style'];

      ov = doubleIt(style.value[key]);
    } else {
      ov = doubleIt(FN.GET_MODEL(target)(key));
    }

    double ldx = 0.0;
    double ldy = 0.0;
    double spx = 0.0;
    double spy = 0.0;

    var RX = VData();

    if (map != null && map != '') {
      map(RX);
    }

    var calc = (double dx, double dy, double x, double y) {
      double v = ov + fn(dx, dy, x, y, unit);

      if (v < RX.min) v = RX.min;
      if (v > RX.max) v = RX.max;

      return v;
    };

    var writer = (v) {
      if (isState) {
        style.value[key] = v;
      } else {
        FN.SET_MODEL(target)(key, v, '\$N');
      }
    };

    var raf = () {
      spx = ME.dx - ldx;
      spy = ME.dy - ldy;

      ldx = ME.dx;
      ldy = ME.dy;

      var cv = calc(ME.dx, ME.dy, ME.x, ME.y);

      if (RX.delay > 0) {
        setTimeout(() {
          writer(cv);
        }, 100);
      } else {
        writer(cv);
      }
    };

    var tickMap = rafity(raf);
    var tick = tickMap['tick'];

    final com = Completer();
    final future = com.future;

    tick();

    PS.subscribeOnce('ProxyMouseupSync', (_) {
      double dx = ME.dx;
      double dy = ME.dy;
      double x = ME.x;
      double y = ME.y;

      if (tick != null) {
        tickMap['done']();

        tick = null;

        ldx = 0;
        ldy = 0;

        if ((spx.abs() < 10.0 && spy.abs() < 10.0) || RX.f == 0.0) {
          if (!isAsync) {
            com.complete('useInteractionFlow done');
          }

          spx = 0.0;
          spy = 0.0;

          return;
        }

        double kx = spx > 0.0 ? 1.0 : -1.0;
        double ky = spy > 0.0 ? 1.0 : -1.0;

        spx = math.min(spx.abs(), 80.0);
        spy = math.min(spy.abs(), 80.0);

        double f = 0.99;
        double n = RX.f;

        var inertia;

        inertia = rafity(() {
          spx = (spx * f).round() - n;
          spy = (spy * f).round() - n;

          if (spx < 2.0 && spy < 2.0) {
            spx = 0.0;
            spy = 0.0;

            if (!isAsync) {
              com.complete('useInteractionFlow done');
            }

            return inertia['done']();
          }

          x += spx * kx;
          y += spy * ky;
          dx += spx * kx;
          dy += spy * ky;

          writer(calc(dx, dy, x, y));
        });

        inertia['tick']();
      }
    });

    if (isAsync) {
      com.complete('useInteractionFlow done');
    }

    return future;
  }
  static useInterpolation(config) async {
    var target = config['target'];
    var state = config['state'];
    var key = config['key'];
    var exp = config['exp'];
    var curve = $bezier[config['curve']];
    var isAsync = config['async'];

    double during = doubleIt(config['during']);

    var isState = state != null && state != '';
    var style;

    double ov = 0.0;
    double to = doubleIt(parseModelStr(exp, target));

    if (isState) {
      var selected = getState(target, state);

      style = selected.value['style'];

      ov = doubleIt(style.value[key]);
    } else {
      ov = doubleIt(FN.GET_MODEL(target)(key));
    }

    var fn = (v) {
      if (isState) {
        style.value[key] = v;
      } else {
        FN.SET_MODEL(target)(key, v, '\$N');
      }
    };

    if (isAsync) {
      tween(from: ov, to: to, duration: during, easing: curve, fn: fn);
    } else {
      await tween(from: ov, to: to, duration: during, easing: curve, fn: fn);
    }
  }
  static editStatu(config) {
    return setStatuValue(config);
  }
  static setCPA(config) {
    var target = config['target'];
    var tag = config['tag'];

    $hero.value[target] = tag + '__' + config['clone'];

    var psid;
    var cachedPid = $context.state.pid;

    psid = PS.subscribe('FA_routerGo', (_) {
      setTimeout(() {
        if ($context.state.pid == cachedPid) {

          $hero.value[target] = [];

          PS.unsubscribe(psid);
        }
      }, 300);
    });
  }
  //https://www.jianshu.com/p/699802529e9c
  static Map promisify(obj) {
    Map pobj = {};
    obj.forEach((K, V) {
      pobj[K] = (data) {
        final com = Completer();
        final future = com.future;
        final done = ([ value ]) => com.complete(value);

        V(data, done);

        return future;
      };
    });
    return pobj;
  }
  static exec(config) async {
    var actions = config['actions'];

    if (config['index'] == null) {
      config['index'] = 0;
    }

    var action = actions[config['index']];

    if (action == null) return;

    if (action) {
      var fn = action[0];
      var args = action[1];

      if (args is Map) {
        args['config'] = config;
      }

      config['response'] = await fn(args);
    } else {
      if (!(actions.length > config['index'] + 1)) return;
    }

    config['index'] += 1;

    FA.exec(config);
  }
  static Future whileAsync(condition, callback) async {
    return FakeWhile().exec(condition, callback);
  }
}
