import 'package:mobx/mobx.dart';

class MobxMeta {
  var value;
  void init(value) {
    if (value is List) {
      this.value = ObservableList.of(value);
    }
    else if (value is Map) {
      this.value = ObservableMap.of(value);
    }
    else {
      this.value = Observable(value);
    }
  }
}

final metaPadding = Atom(name: 'base');

class Watcher extends MobxMeta {
  Watcher(params) {
    super.init(params);
  }

  var handle = metaPadding;

  @override
  get value {
    handle.reportRead();
    return super.value;
  }
  @override
  set value(value) {
    handle.reportWrite(value, super.value, () {
      super.value = value;
    });
  }
}

dynamic observe = (mark, value) {
  var rx = Watcher(value);

  rx.handle = Atom(name: mark);

  return rx;
};

dynamic assignObj = (list) {
  var calc = {};
  list.forEach((obj) {
    obj.forEach((K, V) {
      calc[K] = V;
    });
  });
  return calc;
};