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

ImageFilter blurFilter(double value) {
  return ImageFilter.blur(sigmaX: value, sigmaY: value);
}

final filterMap = {
  'contrast': FilterMatrix.contrast,
  'grayscale': FilterMatrix.grayscale,
  'hueRotate': FilterMatrix.hue,
  'brightness': FilterMatrix.brightness,
  'saturate': FilterMatrix.saturate,
  'opacity': FilterMatrix.opacity,
  'sepia': FilterMatrix.sepia,
  'invert': FilterMatrix.invert,
};

final filterDefault = {
  'contrast': 1.0,
  'grayscale': 0.0,
  'hueRotate': 0.0,
  'brightness': 1.0,
  'saturate': 1.0,
  'opacity': 1.0,
  'sepia': 0.0,
  'invert': 0.0
};

List<double> baseMatrix() {
  return <double>[
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1
  ];
}

List<Widget> calcBackdropFilter(backdropFilter, style) {
  List<double> matrix = baseMatrix();
  List<Widget> levels = [];

  backdropFilter.forEach((K, V) {
    var value;

    if (K == 'blur') {
      if (V == 0.0) return;

      value = blurFilter(V);
    } else {
      var fn = filterMap[K];

      if (fn != null && filterDefault[K] != V) {
        value = ColorFilter.matrix(fn(matrix: matrix, value: V).sublist(0, 20));
      } else {
        return;
      }
    }

    levels.add(Positioned(
      left: style['x'], top: style['y'], right: 0.0, bottom: 70.0,
      child: BackdropFilter(
        filter: value,
        child: Container(color: Colors.black.withOpacity(0))
      ),
    ));
  });

  return levels;
}