import 'package:flutter/material.dart';
import 'dart:math';
import '../store/index.dart';
import './observer.dart';
import './style.dart';
import './FN.dart';

double unit = 1.0;
double statusBarHeight = 0.0;

final $statusBarState = observe('statusBarState', {}); // rebuild proxy
final baseComponentStyle = {
  'base/level': {'width': 320.0, 'height': 160.0},
  'base/container': {'width': 300.0, 'height': 150.0},
  'base/html': {'width': 250.0, 'height': 150.0},
  'base/photo': {'width': 150.0, 'height': 120.0},
  'base/iframe': {'width': 250.0, 'height': 150.0},
  'base/mirror': {'width': 100.0, 'height': 100.0},
  'base/text': {'width': 80.0, 'height': 22.0},
  'base/link': {'width': 80.0, 'height': 22.0},
  'base/icon': {'width': 45.0, 'height': 45.0},
  'base/input': {'width': 140.0, 'height': 30.0},
  'base/textarea': {'width': 140.0, 'height': 60.0},
  'base/video': {'width': 300.0, 'height': 150.0}
};

void setStatusBarHeight(deviceData) {
  double v = deviceData.padding.top;

  if (v > 0.0) {
    statusBarHeight = v;
  }
}

double deviceWidth = 375.0;
double deviceHeight = 667.0;

/* Use 750 as the design size. */
void setUnit(deviceData) {
  double dw = deviceData.size.width;
  double dh = deviceData.size.height;

  // hack for profile and release mode
  if (dw < 10.0 || dh < 10.0) {
    dw = 375.0;
    dh = 667.0;
  }

  unit = dw / 375.0;
  deviceWidth = dw;
  deviceHeight = dh;

  baseComponentStyle['base/level']!['width'] = deviceWidth / unit;
  baseComponentStyle['base/level']!['height'] = deviceHeight / unit;

  setStatusBarHeight(deviceData);

  $prect['Global'] = {
    'pw': deviceWidth,
    'ph': deviceHeight,
    'pdx': 0.0,
    'pdy': 0.0,
    'bdx': 0.0,
    'bdy': 0.0
  };
}

str2num(str) {
  if (str is int) return str.toDouble();
  if (str is double) return str;
  if (str.endsWith('px')) {
    return double.parse(str.substring(0, str.indexOf('px')));
  }
  return str;
}

double doubleIt(n) {
  if (n is double) return n;
  if (n is int) return n.toDouble();

  return double.tryParse(n) ?? 0.0;
}

double rpx(n) => n * unit;

Map calcAP(hid, clone) {
  var $item = $sets[hid].value;
  var status = $item['status'].value;

  var metaName;
  var activeStateList = [];
  var mixinStateList = [];

  status.forEach((statu) {
    var state = statu.value;

    if (!state['active']) return;

    String name = state['name'];

    if (name.contains(':')) return activeStateList.add(state);

    if (name == '\$mixin') {
      activeStateList.add(state);

      if (metaName == null) mixinStateList.add(state);

      return;
    }

    // ignore: avoid_print
    if (metaName != null) return print('meta is repeat $state');

    metaName = name;
    activeStateList = [...mixinStateList, state];
    mixinStateList = [];
  });

  var propsList = [];
  var cloneArr = clone != '' ? clone.split('|').skip(1).toList() : [ '0' ];

  // ignore: avoid_function_literals_in_foreach_calls
  activeStateList.forEach((subState) {
    if (subState['name'] == '\$mixin' || !subState['name'].contains(':')) {
      return propsList.add(subState);
    }

    List nameArr = subState['name'].split(':');
    String name = nameArr[0];

    if (name != metaName) return;

    List expArr = nameArr.skip(1).toList();

    if (expArr.isNotEmpty) {
      var curr;
      var I;

      int L = cloneArr.length;

      var exp;

      for (I = 0; I < L; I++) {
        curr = cloneArr[I];
        exp = expArr[I];

        if (exp != null) {
          if (!subExpCheck(exp, curr, I, hid)) return;
        } else {
          break;
        }
      }

      propsList.add(subState);
    }
  });

  var customKeyList = [{}];
  var mixinStyles = [{}];
  int x = 0;
  int y = 0;
  int tx = 0;
  int ty = 0;
  int d = 0;

  var s;

  for (var props in propsList) {
    customKeyList.add(props['custom'].value);

    var $style = props['style'].value;

    mixinStyles.add($style);

    if ($style['x'] != null) x = $style['x'];
    if ($style['y'] != null) y = $style['y'];
    if ($style['tx'] != null) tx = $style['tx'];
    if ($style['ty'] != null) ty = $style['ty'];
    if ($style['d'] != null) d = $style['d'];
    if ($style['s'] != null) s = $style['s'];
  }

  Map customKeys = assignObj(customKeyList);
  Map style = assignObj(mixinStyles);
  Map mixinStyle = {};

  customKeys.forEach((K, V) {
    mixinStyle[K] = parseModelExp(V, hid, false);
  });

  return {
    'style': {
      ...style,
      'x': x,
      'y': y,
      'tx': tx,
      'ty': ty,
      'gty': ty,
      'd': d,
      's': s,
      ...mixinStyle
    }
  };
}

final $calcCache = {};

getPosition(hid, clone) {
  if ($calcCache[hid + clone] != null) return $position[hid + clone]; //缓存

  Map ap = calcAP(hid, clone);
  var style = ap['style'];
  var position = style['position'];

  $position[hid + clone] = position;
  $calcCache[hid + clone] = true;

  return position;
}

void numAttr(css, List keys) {
  for (var key in keys) {
    if (css[key] != null) {
      css[key] = rpx(str2num(css[key]));
    }
  }
}

final sideDirection = ['Top', 'Right', 'Bottom', 'Left'];
final fourSide = [0, 1, 2, 3];

List calcSides(css, String type) {
  bool isEmpty = true;
  List padding = [0.0, 0.0, 0.0, 0.0];
  List sides = css[type] == null ? padding : css[type].split(' ').map((e) => rpx(str2num(e))).toList();
  List psides = [];

  for (var i in fourSide) {
    String direct = sideDirection[i];

    if (css[type + direct] == null) {
      psides.add(sides[i]);
    } else {
      psides.add(rpx(str2num(css[type + direct])));

      isEmpty = false;
    }
  }

  return isEmpty && css[type] == null ? [] : psides;
}

Map getStyle(hid, clone) {
  Map item = $struct[hid];

  bool isLevel = item['content'] == 'base/level';

  Map ap = calcAP(hid, clone);
  Map css = ap['style'];
  Map<String, double>? baseRect = baseComponentStyle[item['content']];

  css['x'] = rpx(css['x']);
  css['y'] = rpx(css['y']);
  css['rotate'] = css['d'];

  var w = css['width'] == null ? baseRect!['width'] : str2num(css['width']);
  var h = css['height'] == null ? baseRect!['height'] : str2num(css['height']);

  Map prect = $prect[hid + clone] ?? $prect['Global'] ;

  bool isStatic = css['position'] == 'static';

  if (w is String && w.endsWith('%')) {
    double dx = isStatic ? (prect['pdx'] + prect['bdx']) : prect['bdx'];

    css['width'] = (prect['pw'] - dx) / 100.0 * double.parse(w.substring(0, w.indexOf('%')));
  } else {
    css['width'] = rpx(w);
  }

  if (h is String && h.endsWith('%')) {
    double dy = isStatic ? (prect['pdy'] + prect['bdy']) : prect['bdy'];

    css['height'] = (prect['ph'] - dy) / 100.0 * double.parse(h.substring(0, h.indexOf('%')));
  } else {
    css['height'] = rpx(h);
  }

  css['boxShadows'] = css['boxShadow'] == null
  ? []
  : css['boxShadow'].split('inset, ').map((v) => v += v.contains('inset') ? '' : 'inset').toList();

  if (isLevel && css['useSafeArea']) {
    if ($statusBarState.value[hid] == false) {
      css['height'] -= statusBarHeight;
      css['y'] += statusBarHeight;
    }
  }

  if ($safePosition[hid] == true && css['ty'] == 0) {
    css['y'] += statusBarHeight;
  }

  return css;
}

Map calcStyle(hid, clone) {
  var css = getStyle(hid, clone);

  css['rectWidth'] = css['width'];
  css['rectHeight'] = css['height'];
  css['nx'] = 0.0;
  css['ny'] = 0.0;

  List psides = calcSides(css, 'padding');

  if (psides.length > 1) {
    css['padding'] = EdgeInsets.only(top: psides[0], right: psides[1], bottom: psides[2], left: psides[3]);
    css['pdx'] = psides[3] + psides[1];
    css['pdy'] = psides[0] + psides[2];
    css['paddingSide'] = psides;
  } else {
    css['paddingSide'] = [0.0, 0.0, 0.0, 0.0];
  }

  if (css['borderWidth'] != null) {
    var sides = css['borderWidth'].split(' ');

    if (sides.length > 1) {
      sides = sides.map((e) => rpx(str2num(e))).toList();

      css['borderWidths'] = sides;
      css['width'] = css['width'] - sides[1] - sides[3];
      css['height'] = css['height'] - sides[0] - sides[2];
      css['bdx'] = sides[1] + sides[3];
      css['bdy'] = sides[0] + sides[2];
    } else {
      var sideWidth = rpx(str2num(sides[0]));

      css['borderWidths'] = [sideWidth, sideWidth, sideWidth, sideWidth];

      css['bdx'] = css['bdy'] = sideWidth * 2.0;
    }
  }

  if (css['borderRadius'] != null) {
    var sides =
        css['borderRadius'].split(' ').map((e) => rpx(str2num(e)));
    List borderSides = sides.map((v) => Radius.circular(v)).toList();
    css['borderRadiusValue'] = sides.toList();
    css['borderRadius'] = BorderRadius.only(
      topLeft: borderSides[0],
      topRight: borderSides[1],
      bottomRight: borderSides[2],
      bottomLeft: borderSides[3],
    );
  } else {
    css['borderRadiusValue'] = [0.0, 0.0, 0.0, 0.0];
  }

  css['marginSize'] = [0.0, 0.0];

  List msides = calcSides(css, 'margin');

  if (msides.length > 1) {
    css['margin'] = EdgeInsets.only(top: msides[0], right: msides[1], bottom: msides[2], left: msides[3]);
    css['marginSize'] = [msides[3], msides[0]]; //[left, top]
  }

  if (css['backgroundColor'] != null) {
    css['backgroundColor'] = tfColor(css['backgroundColor']);
  }

  if (css['color'] != null) {
    css['color'] = tfColor(css['color']);
  }

  if (css['fill'] != null) {
    css['fill'] = tfColor(css['fill']);
  }

  if (css['borderColor'] != null) {
     css['borderColor'] = tfColor(css['borderColor']);
  }

  if (css['filter'] != null) {
    css['filter'] = tfFilter(css['filter']);
  }

  if (css['backdropFilter'] != null) {
    css['backdropFilter'] = tfFilter(css['backdropFilter']);
  }

  numAttr(css, ['fontSize', 'lineHeight', 'letterSpacing']);

  double k = pi / 180;

  css['perspectValue'] = doubleIt(css['perspectValue'] ?? 0.0) * 10;
  css['rotateX'] = doubleIt(css['rotateX'] ?? 0.0) * k;
  css['rotateY'] = doubleIt(css['rotateY'] ?? 0.0) * k;
  css['rotateZ'] = doubleIt(css['rotateZ'] ?? 0.0) * k;
  css['skewX'] = doubleIt(css['skewX'] ?? 0.0) * k;
  css['skewY'] = doubleIt(css['skewY'] ?? 0.0) * k;
  css['translateX'] = doubleIt(css['translateX'] ?? 0.0) * unit;
  css['translateY'] = doubleIt(css['translateY'] ?? 0.0) * unit;
  css['translateZ'] = doubleIt(css['translateZ'] ?? 0.0) * unit;

  if (css['transition'] != null) {
    var tarr = parseTransition(css['transition']);

    css['during'] = tarr[0] * 1000.0; //s to ms
    css['curve'] = tarr[1];
  }

  return css;
}

const $padding = SizedBox.shrink();
const $zeroEdge = EdgeInsets.only(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0);

List generateArray(n) {
  return List.filled(n.toInt(), 0, growable: true);
}

String setItem(id) {
  return id;
}

int getCloneNum(id, [clone = '']) {
  var copy = GET_(id, '', 'copy');

  if (copy == null) return 1;
  if (copy is int) return copy;
  if (copy is double) return copy.round();

  var mcopy = FN.GET_MODEL(id)('copy', tfClone(clone));
  var flag = arrFirst(mcopy);

  if (flag is String && flag.substring(0, 1) == '\$') {
    flag = parseModelExp(flag, id, false);
  }

  return int.tryParse(flag) ?? 0;
}
getSubClone(id, int J, [clone = '']) {
  var copy = GET_(id, clone, 'copy');

  bool ishasCn = copy != null;
  bool isParentHasCn = clone.contains('|');

  if (isParentHasCn) {
    if (ishasCn) {
      return clone + '|' + J.toString();
    } else {
      return clone;
    }
  } else {
    if (ishasCn) {
      return '|' + J.toString();
    } else {
      return '';
    }
  }
}

bool canRender(id) {
  var render = GET_(id, '', 'render');

  if (render == null) return true;
  if (render == 'false') return false;
  if (render is bool) return render;

  return true;
}

Map calcState(hid) {
  var item = $struct[hid];
  var $item = $sets[hid].value;
  var config = {
    'hid': setItem(hid),
    'item': $item,
    'clone': '',
    'type': item['type'],
    'style': calcStyle(hid, '')
  };
  return config;
}

class RenderPage extends StatelessWidget {
  final child;
  RenderPage(this.child);
  @override
  Widget build(BuildContext context) {
    return child;
  }
}

Widget transition(slot) {
  return slot;
}

final FractionalTowardMap = {
  'left': 0.0,
  'center': 0.5,
  'right': 1.0,
  'top': 0.0,
  'bottom': 1.0
};

FractionalOffset parseTransformOrigin(String input) {
  if (input == 'center') return FractionalOffset.center;

  List<String> arr = input.split(' ');

  String a = arr[0];
  String b = arr[1];

  return FractionalOffset(
    FractionalTowardMap[a] ?? ((double.tryParse(a.substring(0, a.length - 1)) ?? 0.0) / 100.0),
    FractionalTowardMap[b] ?? ((double.tryParse(b.substring(0, b.length - 1)) ?? 0.0) / 100.0)
  );
}

double amendValue(double a, double b) {
  return sqrt(a * a + b * b) / 2.0 * -1;
}
