part of '../style.dart';

Map tfLinearGradient(str) {
  List<double> stops = [];
  List<Color> colors = <Color>[];
  double deg = 0.0;

  String content = str.substring(16, str.length - 1);
  List arr = content.split('deg,');

  deg = double.parse(arr[0]) * -1.0;

  arr[1].trim().split(', ').forEach((block) {
    List arr = block.split(' ');
    String color = arr[0];
    String stop = arr[1];
    
    colors.add(tfColor(color));
    stops.add(double.parse(stop.substring(0, stop.length - 1)) / 100.0);
  });
  
  return {
    'deg': deg,
    'stops': stops,
    'colors': colors
  };
}

Map tfRadialGradient(str) {

  List<double> stops = [];
  List<Color> colors = <Color>[];

  String content = str.substring(16, str.length - 1);
  List arr = content.split('circle at');

  double r = double.parse(arr[0].replaceFirst('px', '').trim());

  List subContent = arr[1].trim().split(', ');

  List point = subContent[0].split(' ').map((v) {
    return (double.parse(v.substring(0, v.length - 1)) / 100.0 - 0.5) * 2.0;
  }).toList();

  subContent.skip(1).forEach((block) {
    List arr = block.split(' ');
    String color = arr[0];
    String stop = arr[1];
    
    colors.add(tfColor(color));
    stops.add(double.parse(stop.substring(0, stop.length - 1)) / 100.0);
  });

  return {
    'R': r,
    'point': point,
    'stops': stops,
    'colors': colors
  };
}

List calculateRotateAlign(List point, int deg) {
  double px = point[0];
  double py = point[1];
  double x = px * math.cos(deg * math.pi / 180.0) + py * math.sin(deg * math.pi / 180.0);
  double y = -px * math.sin(deg * math.pi / 180.0) + py * math.cos(deg * math.pi / 180.0);

  x = (x * 100).round() / 100;
  y = (y * 100).round() / 100;

  return [x, y];
}

calcGradient(style) {
  var bgi = style['backgroundImage'];
  
  if (bgi == null) return null;
  if (bgi.contains('url(')) return null;

  double W = style['width'];
  double H = style['height'];
  double size = style['FlutterGradientSize'] == null ? 1.0 : double.parse(style['FlutterGradientSize']);

  if (bgi.contains('linear')) {
    // The scaling parameters are consistent with the web, i.e. Alignment is calculated relative to the square, which is a process that mimics the web way algorithm.
    double m = W / H; 

    Map conf = tfLinearGradient(bgi);
    List begin = calculateRotateAlign([0.0, size], conf['deg'].round());

    begin[1] *= m;

    return LinearGradient(
      begin: Alignment(begin[0], begin[1]),
      end: Alignment(begin[0] * -1, begin[1] * -1), 
      colors: conf['colors'], 
      stops: conf['stops'],
      tileMode: size == 1.0 ? TileMode.clamp : TileMode.repeated
    );
  }

  if (bgi.contains('radial')) {
    Map conf = tfRadialGradient(bgi);

    // https://api.flutter.dev/flutter/painting/RadialGradient/radius.html
    // flutter takes the smallest edge as a reference.
    double n = W > H ? H : W;

    List center = conf['point'];

    return RadialGradient(
      center: Alignment(center[0], center[1]),
      radius: conf['R'] / n,
      colors: conf['colors'], 
      stops: conf['stops'],
      tileMode: size == 1.0 ? TileMode.clamp : TileMode.repeated
    );
  }

  return null;
}