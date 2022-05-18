import 'package:flutter/material.dart';
import '../store/index.dart';
import './observer.dart';
import './style.dart';
import './FN.dart';

double unit = 1.0;
double statusBarHeight = 48.0;

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

  unit = deviceData.size.width / 375.0;
  deviceWidth = deviceData.size.width;
  deviceHeight = deviceData.size.height;

  baseComponentStyle['base/level']!['width'] = deviceWidth / unit;
  baseComponentStyle['base/level']!['height'] = deviceHeight / unit;

  setStatusBarHeight(deviceData);
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
  var activeList = [];

  status.forEach((statu) {
    if (statu.value['active']) {
      activeList.add(statu.value);
    }
  });

  var metaState;
  var metaName;
  var activeFilterStates = [];
  var filters = [];

  activeList.forEach((state) {
    if (state['name'].indexOf(':') > 0) {
      activeFilterStates.add(state);
      filters.add(state['name']);
    } else {
      metaState = state;
      metaName = state['name'];
    }
  });

  var mixinList = [];
  var calcProps;
  var mixinCustomKeys = [{}];
  var mixinStyles = [];

  var cloneArr = clone != '' ? clone.split('|').skip(1).toList() : [ '0' ];

  int j = 0;

  filters.forEach((filter) {
    int F = j;
    j += 1;

    List nameArr = filter.split(':');
    String name = nameArr[0];

    if (name != metaName) return;

    List expArr = nameArr.skip(1).toList();

    if (expArr.length > 0) {
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

      var validProps = activeFilterStates[F];
      mixinList.add(validProps);
      mixinCustomKeys.add(validProps['custom'].value);
      mixinStyles.add(validProps['style'].value);
    }
  });

  calcProps = mixinList.length > 0 ? mixinList[mixinList.length - 1] : metaState;

  List mergeList = [];

  mergeList.addAll(mixinCustomKeys);
  mergeList.add(calcProps['custom'].value);
  mixinStyles.add(calcProps['style'].value);

  Map customKeys = assignObj(mergeList);
  Map style = assignObj(mixinStyles);
  Map mixinStyle = {};

  customKeys.forEach((K, V) {
    mixinStyle[K] = parseModelExp(V, hid, true);
  });

  return {
    'style': {
      ...style,
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

Map getStyle(hid, clone) {
  var item = $struct[hid];

  bool isLevel = item['content'] == 'base/level';

  Map ap = calcAP(hid, clone);
  
  var style = ap['style'];
  var baseRect = baseComponentStyle[item['content']];

  style['x'] = rpx(style['x']);
  style['y'] = rpx(style['y']);
  style['rotate'] = style['d'];

  var w = style['width'] == null ? baseRect!['width'] : str2num(style['width']);
  var h = style['height'] == null ? baseRect!['height'] : str2num(style['height']);

  Map prect = $prect[hid + clone] ?? {};

  if (w is String && w.endsWith('%')) {
    style['width'] = (prect['pw'] - prect['pdx']) / 100.0 * double.parse(w.substring(0, w.indexOf('%')));
  } else {
    style['width'] = rpx(w);
  }

  if (h is String && h.endsWith('%')) {
    style['height'] = (prect['ph'] - prect['pdy']) / 100.0 * double.parse(h.substring(0, h.indexOf('%')));
  } else {
    style['height'] = rpx(h);
  }

  style['boxShadows'] = style['boxShadow'] == null 
  ? [] 
  : style['boxShadow'].split('inset, ').map((v) => v += v.contains('inset') ? '' : 'inset').toList();

  if (isLevel && style['useSafeArea']) {
    if ($statusBarState.value[hid] == false) {
      style['height'] -= statusBarHeight;
      style['y'] += statusBarHeight;
    }
  }

  return style;
}

void numAttr(css, List keys) {
  keys.forEach((key) {
    if (css[key] != null) {
      css[key] = rpx(str2num(css[key]));
    }
  });
}

final sideDirection = ['Top', 'Right', 'Bottom', 'Left'];

List calcSides(css, String type) {
  bool isEmpty = true;
  List padding = [0.0, 0.0, 0.0, 0.0];
  List sides = css[type] == null ? padding : css[type].split(' ').map((e) => rpx(str2num(e))).toList();
  List psides = [];

  [0, 1, 2, 3].forEach((i) {
    String direct = sideDirection[i];

    if (css[type + direct] == null) {
      psides.add(sides[i]);
    } else {
      psides.add(rpx(str2num(css[type + direct])));

      isEmpty = false;
    }
  });

  return isEmpty && css[type] == null ? [] : psides;
}

Map calcStyle(hid, clone) {
  var css = getStyle(hid, clone);

  css['rectWidth'] = css['width']; 
  css['rectHeight'] = css['height'];
  css['nx'] = 0.0;
  css['ny'] = 0.0;

  if (css['borderWidth'] != null) {
    var sides = css['borderWidth'].split(' ');

    if (sides.length > 1) {
      sides = sides.map((e) => rpx(str2num(e))).toList();

      css['borderWidths'] = sides;
      css['width'] = css['width'] - sides[1] - sides[3];
      css['height'] = css['height'] - sides[0] - sides[2];
    } else {
      var sideWidth = rpx(str2num(sides[0]));

      css['borderWidths'] = [sideWidth, sideWidth, sideWidth, sideWidth];
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

  List psides = calcSides(css, 'padding');
  
  if (psides.length > 1) {
    css['padding'] = EdgeInsets.only(top: psides[0], right: psides[1], bottom: psides[2], left: psides[3]);
    css['pdx'] = psides[3] + psides[1];
    css['pdy'] = psides[0] + psides[2];
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

  if (css['borderColor'] != null) {
     css['borderColor'] = tfColor(css['borderColor']);
  }

  if (css['filter'] != null) {
    css['filter'] = tfFilter(css['filter']);
  }

  numAttr(css, ['fontSize', 'lineHeight', 'letterSpacing']);

  return css;
}

final $padding = SizedBox.shrink();
final $zeroEdge = EdgeInsets.only(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0);

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