part of 'FN.dart';

var intervalClockMap = {};
var intervalClockIndex = 0;
var timeoutClockMap = {};
var timeoutIndex = 0;

int setTimeout(callback, int ms) {
  timeoutIndex += 1;

  timeoutClockMap[timeoutIndex] = Timer(const Duration(milliseconds: 1) * ms, () {
    callback();
  });

  return timeoutIndex;
}

void clearTimeout(index) {
  var timer = timeoutClockMap[index];

  if (timer != null) {
    timer.cancel();
    
    timeoutClockMap[index] = null;
  }
}

int setInterval(callback, int ms) {
  intervalClockIndex += 1;

  Timer.periodic(const Duration(milliseconds: 1) * ms, (timer) {
    intervalClockMap[intervalClockIndex] = timer;
  });

  return intervalClockIndex;
}

void cleanInterval(index) {
  var timer = intervalClockMap[index];

  if (timer != null) {
    timer.cancel();
    
    intervalClockMap[index] = null;
  }
}

//kraken src/module/schedule_frame.dart
typedef DoubleCallback = void Function(double);
typedef VoidCallback = void Function();

int _id = 1;
Map<int, bool> _animationFrameCallbackMap = {};

int requestAnimationFrame(DoubleCallback callback) {
  int id = _id++;
  _animationFrameCallbackMap[id] = true;
  SchedulerBinding.instance.addPostFrameCallback((Duration timeStamp) {
    if (_animationFrameCallbackMap.containsKey(id)) {
      _animationFrameCallbackMap.remove(id);
      double highResTimeStamp = timeStamp.inMicroseconds / 1000;
      callback(highResTimeStamp);
    }
  });
  SchedulerBinding.instance.scheduleFrame();
  return id;
}

void cancelAnimationFrame(int id) {
  if (_animationFrameCallbackMap.containsKey(id)) {
    _animationFrameCallbackMap.remove(id);
  }
}

void requestBatchUpdate() {
  SchedulerBinding.instance.scheduleFrame();
}

void clearAnimationFrame() {
  _animationFrameCallbackMap.clear();
}
