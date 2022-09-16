import '../../common/FN.dart';
import '../../common/mixin.dart';
import './index.dart';

playRecord(ME, List arr) async {
  var cursor = $Global.value['previewCursor'];
  Map $cursor = cursor.value;

  double ox = $cursor['x'];
  double oy = $cursor['y'];

  cursor.value['useTransition'] = false;

  for (var obj in arr) {
    if (obj == 'E') {
      PS.publish('ProxyMouseupSync');

      return;
    }

    int x = obj['x'];
    int y = obj['y'];
    int dx = obj['dx'];
    int dy = obj['dy'];

    ME.x = x.toDouble();
    ME.y = y.toDouble();
    ME.dx = dx.toDouble();
    ME.dy = dy.toDouble();

    cursor.value['x'] = ox + dx * unit;
    cursor.value['y'] = oy + dy * unit;

    await FN.sleep(34);
  }
}

class AutoMouseEvent {
  double x = 0;
  double y = 0;
  double dx = 0;
  double dy = 0;
}

playMouseRecord(eid) {
  AutoMouseEvent ME = AutoMouseEvent();

  List arr = ($Global.value['interactionRecord'])[eid];

  playRecord(ME, arr);

  return ME;
}

cleanMouseRecord() {
  $Global.value['interactionRecord'] = {};
  $Global.value['previewEventMap'] = {};
  $Global.value['previewCursor'].value['x'] = -20.0;
  $Global.value['previewCursor'].value['y'] = -20.0;
}