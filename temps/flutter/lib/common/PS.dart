part of 'FN.dart';

final psId = {};
final psFn = {};

class PS {
  static subscribe(topic, callback) {
    if (psId[topic] == null) {
      psId[topic] = GV.T();
      psFn[topic] = [callback];
    } else {
      psFn[topic].add(callback);
    }

    return {
      'topic': topic,
      'index': psFn[topic].length - 1
    };
  }
  static subscribeOnce(topic, callback) {
    Map sid = {};

    sid = PS.subscribe(topic, ([value]) {
      callback(value);
      PS.unsubscribe(sid);
    });
  }
  static publish(topic, [data]) {
    setTimeout(() {
      PS.publishSync(topic, data);
    }, 16);
  }
  static publishSync(topic, [data]) {
    var fns = psFn[topic];

    if (fns is List) {
      for (var fn in fns) {
        if (fn != null) {
          fn(data);
        }
      }
    }
  }
  static unsubscribe(id, [isSync = false]) {
    if (id is Map) {
      var index = id['index'];
      var topic = id['topic'];

      if (isSync) {
        psFn[topic][index] = null;
        if (psFn[topic].length < 1) {
          psId[topic] = null;
          psFn[topic] = null;
        }
      } else {
        // The default is to clean up on the next frame to avoid conflicts.
        setTimeout(() {
          psFn[topic][index] = null;
          if (psFn[topic].length < 1) {
            psId[topic] = null;
            psFn[topic] = null;
          }
        }, 0);
      }
    }
    if (id is String && psId[id] != null) {
      psId[id] = null;
      psFn[id] = null;
    }
  }
}
// EventBus.bind 