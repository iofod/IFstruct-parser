import 'package:flutter/foundation.dart';
import 'dart:math' as math;
import '../../common/FN.dart';
import '../../common/SDK.dart';
import '../../common/mixin.dart';
import '../../common/observer.dart';
import '../../store/index.dart';
import './connect.dart';
import './helper.dart';

List cases = [];

final $Global = observe('Global', {
  'useRunCases': false,
  'previewEventMap': {},
  'interactionRecord': {},
  'previewCursor': observe('previewCursor', {
    'x': -20.0,
    'y': -20.0,
    'useTransition': true,
  })
});

setCTX(data) {
  cases = data['cases'];
}

setDebugCursor(conf) {
  Map offset = conf['offset'];

  var cursor = $Global.value['previewCursor'];

  cursor.value['useTransition'] = true;
  cursor.value['x'] = ((offset['x'] ?? 0.0) + offset['dx']).toDouble() * unit;
  cursor.value['y'] = ((offset['y'] ?? 0.0) + offset['dy']).toDouble() * unit;
}

Future runGroup(list, context) async {
  if (kDebugMode) {
    print('--- runGroup ---');
  }

  for (var conf in list) {
    if (conf['assert'] != null) {
      try {
        bool flag = evalJS(parseModelExp(conf['assert'], 'var', true));

        if (kDebugMode) {
          print(''''IF:', ${conf['assert']}, ${flag ? 'O' : 'X'}''');
        }

        await runGroup(flag ? conf['O'] : conf['X'], context);
      } catch (e) {
        if (kDebugMode) {
          print(e);

          runCasesCallback({
            'code': 5,
            'data': {
              'conf': conf,
              'error': {
                'ErrorType': 'runGroup',
                'message': e.toString()
              }
            },
            'msg': 'runGroup error'
          });
        }

        return;
      }
    } else {
      String value = conf['value'];
      var item = cases.where((obj) => obj['id'] == value).first;

      if (item == null) return;

      if (item['type'] == 'group') {
        await runGroup(dealFlow(item['conf']), item['conf']);
      }

      if (item['type'] == 'case') {
        await runCase(item['conf']);
      }
    }
  }

  return;
}

Future runCases(Map data) async {
  $Global.value['useRunCases'] = true;

  if (data['type'] == 'case') {
    await runCase(data['conf']);
  }

  if (data['type'] == 'group') {
    Map context = data['conf'];
    await runGroup(dealFlow(context), context);
  }

  $Global.value['useRunCases'] = false;

  setTimeout(() {
    $Global.value['previewCursor'].value['x'] = -20.0;
    $Global.value['previewCursor'].value['y'] = -20.0;
  }, 200);

  runCasesCallback({
    'code': 0, 'data': {}, 'msg': 'success'
  });

  return;
}

Future runCase(conf) async {
  List list = dealCaseSteps(conf['steps']);

  if (kDebugMode) {
    print('--- runCase ---');
  }

  if (list.isEmpty) return;

  Map ir = $Global.value['interactionRecord'];

  $Global.value['interactionRecord'] = {
    ...ir,
    ...(conf['interactionRecord'])
  };

  await FN.sleep(900);
  await runSteps(list);

  return;
}

const FlutterEVM = {
  'click': 'tap',
  'touchstart': 'pointerdown',
  'touchmove': 'pointermove',
  'touchend': 'pointerup',
  'touchcancel': 'pointercancel',
  'swipe': 'tap',
  'longtap': 'longpress',
};

Future runSteps(list) async {
  int i = 0;
  int L = list.length;

  if (kDebugMode) {
    print('--- runSteps ---');
  }

  try {
    for (var obj in list) {
      if (obj is List) {
        List right = (i + 1 == L) ? [] : list.sublist(i + 1);
        List steps = [obj, right];

        await Future.wait(steps.map((v) async {
          await runSteps(v);

          return;
        }).toList());

        return;
      }

      var next = (i + 1 == L) ? null : list[i + 1];

      int wait = (next != null && next is! List) ? (next['_'] - next['_pt'] - obj['_']).toInt() : 1000;

      String hid = obj['hid'];
      String event = obj['event'];
      String pid = obj['pid'];
      Map context = obj['context'] ?? {};

      if (wait > 0) await FN.sleep(wait);

      if (pid != $currentContextPage) {
        callRoutePUSH({
          'target': pid,
          'during': 300,
          'transition': 'fade',
          'replace': false,
        });

        await FN.sleep(900);
      }

      var value = obj['value'];

      String clone = obj['clone'];

      var el = hid + clone;

      context['target'] = context['toElement'] = context['srcElement'] = el;
      context['type'] = event;

      if (obj['offset'] == null) {
        obj['offset'] = {
          'dx': 0,
          'dy': 0,
          'x': 0,
          'y': 0
        };
      }

      String hash = hid + clone + '-' + (FlutterEVM[event] ?? event);

      setDebugCursor(obj);

      Map previewEventMap = $Global.value['previewEventMap'];

      previewEventMap[hid] = obj['hash'];

      if (FN.SETS(hid) == null) {
        if (kDebugMode) {
          print('$hid is invalid');
        }

        return;
      }

      await FN.sleep(300);

      switch (event) {
        case 'input [system]':
          FN.SET_MODEL(hid)('inputValue', value, tfClone(clone));
          FN.SET_MODEL(hid)('value', value, tfClone(clone));

          break;
        case 'change [system]':
          FN.SET_MODEL(hid)('value', value, tfClone(clone));

          break;
        case 'scroll [system]':
          PS.publish('vscrollTo:' + hid + clone, (obj['scrollValue'] * unit).toDouble());

          await FN.sleep(500);

          break;
        default:
          PS.publish(hash, obj);

          await Future.any([proxyEvent('$hash|success'), proxyEvent('$hash|fail')]);

          break;
      }

      await FN.sleep(math.min(wait, 3000));

      i += 1;
    }
  } catch (e) {
    if (kDebugMode) {
      print(e);

      runCasesCallback({
        'code': 5,
        'data': {
          'conf': list[i],
          'error': {
            'ErrorType': 'runSteps',
            'message': e.toString()
          }
        },
        'msg': 'runSteps error'
      });
    }

    return;
  }

  return;
}
