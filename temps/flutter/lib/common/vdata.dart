
import 'dart:math' as math;
import './mixin.dart';

class VData {
  double f = 0.0;
  double delay = 0.0;
  double te = 0.0;
  double min = -double.infinity;
  double max = double.infinity;
  
  Inertia(n) {
    f = math.min(80.0, doubleIt(n).abs());

    return this;
  }
  Delay(t) {
    delay += doubleIt(t);

    return this;
  }
  Throttle(t) {
    te = doubleIt(t);

    return this;
  }
  Limit(m, x) {
    min = doubleIt(m);
    max = doubleIt(x);

    return this;
  }
}