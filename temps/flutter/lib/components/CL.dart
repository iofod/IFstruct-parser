import 'dart:convert';
import 'package:flutter/material.dart';
import '../store/index.dart';
import './EV.dart';
import '../common/FN.dart';

final evCalled = {};
var evPropagaMap = {};
var evPropagaSelfMap = {};
final psCache = {};

calcCloneIndex(hid, clone, index) {
	if (clone is String && clone.contains('|')) {
		setCurrentClone(hid, clone);

		index = int.parse(clone.substring(clone.lastIndexOf('|') + 1));
	}

	return index;
}

calcParentClone(hid, clone) {
  var copy = GET_(hid, clone, 'copy');

  if (copy == null || copy == '') return clone;

  if (copy is String) copy = int.parse(copy);

  if (clone is String && clone.contains('|') && copy > 0) {
    return clone.substring(0, clone.lastIndexOf('|'));
  } else {
    return clone;
  }
}

calcParentEvent(hid, clone, eventName) {
  var pcv = calcParentClone(hid, clone);
  var pid = $struct[hid]['parent'];

  if (pid == null) return false;

  return { 'mark' : '${pid+pcv}-$eventName', 'pid': pid, 'pclone': pcv };
}

void stopPropagation(hid, clone, eventName) {
  var pn = calcParentEvent(hid, clone, eventName);

  if (pn != false) {
    var evMark = '${pn['pid']+pn['pclone']}-$eventName';

    evPropagaMap[evMark] = true;

    setTimeout(() {
      evPropagaMap[evMark] = null;
    }, 17);

    stopPropagation(pn['pid'], pn['pclone'], eventName);
  }

}

void propagation(hid, clone, eventName, e) {
  var pn = calcParentEvent(hid, clone, eventName);

  if (pn != false) {
    PS.publishSync(pn['mark'], e);
  }
}

void propagaMark(hid, clone, eventName) {
  var pn = calcParentEvent(hid, clone, eventName);

  if (pn != false) {
    var evMark = '${pn['pid']+pn['pclone']}-$eventName';

    evPropagaSelfMap[evMark] = true;

    setTimeout(() {
      evPropagaSelfMap[evMark] = null;
    }, 17);

    propagaMark(pn['pid'], pn['pclone'], eventName);
  }
}

class EventContext {
  final String hid;
  final String clone;
  final int index;
  var event;
  var response;
  final String eventName;
  EventContext({ required this.hid, required this.clone, required this.index, required this.eventName, this.event, this.response });

  @override
  String toString() {
    return jsonEncode({
      'hid': hid,
      'clone': clone,
      'index': index,
      'event': event is EventValue ? event.toMap() : event.toString(),
      'eventName': eventName,
      'response': response
    });
  }
}

class EventDetail {
  final String hid;
  final EventContext context;
  final event;

  EventDetail({ required this.hid, required this.context, this.event });

  @override
  String toString() {
    return jsonEncode({
      'hid': hid,
      'context': context.toString(),
      'event': event is EventValue ? event.toMap() : event.toString()
    });
  }
}

class EventValue {
  final value;
  final selfId;

  EventValue(this.value, this.selfId);

  Map toMap() {
    return {
      'value': value.toString(),
      'selfId': selfId
    };
  }

  @override
  String toString() {
    return jsonEncode(toMap());
  }
}

calcEventContext(hid, clone, event, index, eventName) {
  EventContext context = EventContext(hid: hid, clone: clone, index: index, event: event, response: null, eventName: eventName);

  return context;
}

EV(listen, config, eventName) {
  if (listen != null) {
    final hid = config.hid;
    final clone = config.clone;

    var eventMark = '${hid+clone}-$eventName';

    var callback = ([e]) {
      final index = calcCloneIndex(hid, clone, 0);
      final fn = listen['fn'];
      final originEvent = EventValue(e, hid);
      // In the case where the original pointer and gesture are shared, the gesture does not have a bubbling function and is therefore specialised.
      final isAutoPropa = eventName.contains('touch') || eventName.contains('pointer');

      if (fn == null) return null;

      // 1. Handling of non-automatic bubbling.
      if (!isAutoPropa && e is EventValue) {
        if (listen['self'] == true && e.selfId != hid) {
          return null;
        }
      } else {
        e = EventValue(e, hid);
      }

      if (isAutoPropa) {
      // 2. Auto-bubbling self handling.
        if (listen['self'] == true) {
          if (evPropagaSelfMap[eventMark] == true) {
            return null;
          }
        }

        // Stop handling for automatic bubbling.
        if (evPropagaMap[eventMark] == true) {
          return null;
        }
      }

      EventContext context = calcEventContext(hid, clone, e, index, eventName);

      if (evCalled[hid + clone + eventName] != true) {
        if (listen['once'] == true) {
          evCalled[hid + clone + eventName] = true;
        }

        fn(EventDetail(hid: hid, context: context, event: e )).then((v) {
          context.response = v;
        });
      }

      // Simulates the bubble handling mechanism of web events.
      // The raw pointer and web mechanisms are similar, so blocking propagation needs to be handled.
      if (isAutoPropa && listen['stop'] == true) {
        stopPropagation(hid, clone, eventName);
      } else if (!isAutoPropa && listen['stop'] != true) {
        // For those where the system is unable to bubble, the proxy bubbles.
        propagation(hid, clone, eventName, originEvent);
      } else {
        // Automatic bubbling requires the implementation of self judgement.
        propagaMark(hid, clone, eventName);
      }

      PS.publishSync(eventMark + '|success');

      return context;
    };

    if (psCache[eventMark] == null) {
      psCache[eventMark] = PS.subscribe(eventMark, callback);
    }

    return ([e]) {
      PS.publishSync(eventMark, e);
    };
  }

  return null;
}

bindInputEvent(config, evm) {
  List inputEVL = ['focus', 'blur', 'input', 'change'];

  bindProxyEvent(config, evm, inputEVL);
}

bindVideoEvent(config, evm) {
  List videoEVL = ['play', 'pause', 'ended', 'error', 'waiting'];

  bindProxyEvent(config, evm, videoEVL);
}

bindProxyEvent(config, evm, List EVL) {
  String hid = config.hid;
  String clone = config.clone;

  for (var evn in EVL) {
    final evMark = '${hid+clone}-${evn}EventProxy';

    if (evm[evn] != null && psCache[evMark] == null) {
      psCache[evMark] = PS.subscribe(evMark, EV(evm[evn], config, evn));
    }
  }
}

Widget bindEvent(wrap, config) {
  final hid = config.hid;
  final clone = config.clone;
  final item = $struct[hid];
  final events = item['events'];

  if (events.length == 0) return wrap;

  var evm = eventMap[hid];

  if (evm == null) {
    log('evm is invalid, please check EV.dart $hid');
  }

  evm!.forEach((key, value) {
    if (key.contains('modelchange')) {
      var arr = key.split('##');
      var mk = arr[1];

      PS.unsubscribe('$hid##$mk.modelchange', true);
      PS.subscribe('$hid##$mk.modelchange', EV(value, config, 'modelchange'));
    }
  });

  if (evm['routechange'] != null && psCache[hid + clone + 'routechange'] == null) {
    psCache[hid + clone + 'routechange'] = PS.subscribe('routechange', EV(evm['routechange'], config, 'routechange'));
  }

  if (evm['ready'] != null && psCache[hid + clone + 'readyEvent'] == null) {
    psCache[hid + clone + 'readyEvent'] = PS.subscribe('${hid+clone}-readyEvent', EV(evm['ready'], config, 'ready'));
  }


  if (item['content'] == 'base/input' || item['content'] == 'base/textarea') {
    bindInputEvent(config, evm);
  }

  if (item['content'] == 'base/video') {
    bindVideoEvent(config, evm);
  }

  return Listener(
    // https://book.flutterchina.club/chapter8/listener.html
    behavior: HitTestBehavior.opaque,
    onPointerCancel: EV(evm['onPanCancel'], config, 'pointercancel'),
    onPointerDown: EV(evm['onPanDown'], config, 'pointerdown'),
    onPointerMove: EV(evm['onPanUpdate'], config, 'pointermove'),
    onPointerUp: EV(evm['onPanEnd'], config, 'pointerup'),
    child: GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: EV(evm['onTap'], config, 'tap'),
      onLongPress: EV(evm['onLongPress'], config, 'longpress'),
      child: wrap,
    ),
  );
}
