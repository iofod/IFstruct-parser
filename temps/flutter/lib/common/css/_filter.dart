part of '../style.dart';

double toNum(str, p) {
  return double.tryParse(str.substring(0, str.length - p)) ?? 0.0;
}

Map tfFilter(str) {
  Map list = {};

  if (str != null && str != 'initial') {
    str.split(' ').forEach((v) {
      String param = v.substring(v.indexOf('(') + 1, v.length - 1);

      var key = v.substring(0, v.indexOf('('));
      var value;

      if (param.contains('px')) value = toNum(param, 2);
      if (param.contains('%')) value = toNum(param, 1) / 100.0;
      if (param.contains('deg')) value = toNum(param, 3);

      if (key == 'hue-rotate') key = 'hueRotate';

      list[key] = value;
    });
  }

  return list;
}

Widget calcFilter(filter, slot) {
  CSSFilterMatrix instant = CSSFilterMatrix();

  instant.conf = filter;

  return CSSFilter.apply(
    child: slot,
    value: instant
  );
}