part of '../style.dart';

double px2d(str) {
  return rpx(double.parse(str.substring(0, str.length - 2)));
}

//eg: "boxShadow": "7px -7px 16px 0px #000, 0px 0px 0px 0px #000 inset"
Map calcBoxShadow(str, [type = 'outer']) {
  List arr = str.split(', ');
  List block = (type == 'outer' ? arr[0] : arr[1]).split(' ');


  return {
    'offset': Offset(px2d(block[0]), px2d(block[1])),
    'blur': px2d(block[2]),
    'spead': px2d(block[3]),
    'color': tfColor(block[4]),
  };
}

BoxShadow genBoxShadow(boxShadow, type) {
  var shadowConf = calcBoxShadow(boxShadow, 'outer');

  return BoxShadow(
        color: shadowConf['color'],
        offset: shadowConf['offset'],
        blurRadius: shadowConf['blur'],
        spreadRadius: shadowConf['spead'],
        blurStyle: BlurStyle.normal
  );
}

//eg: "-1px 3px 3px #7FDA4D",
Map calcTextShadow(str) {
  List block = str.split(' ');

  return {
    'offset': Offset(px2d(block[0]), px2d(block[1])),
    'blur': px2d(block[2]),
    'color': tfColor(block[3]),
  };
}

Shadow genTextShadow(textShadow) {
  Map shadowConf = calcTextShadow(textShadow);

  return Shadow(
    blurRadius: shadowConf['blur'],
    color: shadowConf['color'],
    offset: shadowConf['offset'],
  );
}
