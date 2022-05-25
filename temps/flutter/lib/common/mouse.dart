part of 'FN.dart';

class MouseProxy {
  double x = 0;
  double y = 0;
  double sx = 0;
  double sy = 0;
  double mx = 0;
  double my = 0;
  int T = 0;
  bool isDrag = false;
  var bid;
  
  start(ev) {
    var e = ev.position;

    if (bid == null) {
      bid = GV.T();
      x = sx = e.dx;
      y = sy = e.dy;

      PS.publishSync('ProxyMousedownSync');
      PS.publish('ProxyMousedown');

      T = GV.T();
    } else {
      log('$bid $e');
    }
  }
  move(ev) {
    var e = ev.position;
    var dx = e.dx;
    var dy = e.dy;

    if (bid != null) {
      x = dx;
      y = dy;

      if (GV.T() - T > 100) {
        isDrag = true;
      }
    }

    mx = dx;
    my = dy;
  }
  end(ev) {
    if (bid != null) {
      bid = null;
      isDrag = false;

      x = sx;
      y = sy;

      PS.publishSync('ProxyMouseupSync');
      PS.publish('ProxyMouseup');
    }
  }
  get dx {
    return x - sx;
  }
  get dy {
    return y - sy;
  }
}

final MOUSE = MouseProxy();
