part of '../style.dart';

//https://medium.com/flutter-community/flutter-custom-clipper-28c6d380fdd6
//https://api.flutter.dev/flutter/dart-ui/Path-class.html
//https://api.flutter.dev/flutter/dart-ui/Path/addOval.html
class IFclipper extends CustomClipper<Path>{
  final value;
  IFclipper(this.value);

  value2point(Size size) {
    double W = size.width / 100.0;
    double H = size.height / 100.0;
    bool usePercent = true;

    var val = value
      .substring(8, value.length - 1)
      .split(', ')
      .map((s) {
        return s.split(' ').map((String v) {
          if (v.contains('%')) {
            return double.parse(v.replaceFirst('%', ''));
          } else {
            usePercent = false;
            return rpx(double.parse(v.replaceFirst('px', '')));
          }
        });
      })
      .map((point) {
        double x = point.first;
        double y = point.last;

        if (usePercent) {
          return [x * W, y * H];
        } else {
          return [x, y];
        }
      });
    return val;
  }
  value2Oval(Size size) {
    double W = size.width / 100.0;
    double H = size.height / 100.0;
    bool usePercent = true;

    var arr = value
    .substring(8, value.length - 1)
    .split(' at ')
    .map((sub) {
      return sub.split(' ').map((v) {
        if (v.contains('%')) {
          return double.parse(v.replaceFirst('%', ''));
        } else {
          usePercent = false;
          return rpx(double.parse(v.replaceFirst('px', '')));
        }
       });
    }).map((point) {
      double x = point.first;
      double y = point.last;
      if (usePercent) {
        return [x * W, y * H];
      } else {
        return [x, y];
      }
    });
  
    List rp = arr.first;
    List cp = arr.last;
    return {
      'position': cp,
      'radius': rp
    };
  }
  Path getPolygon(size) {
    Path path = Path();
    
    var val = value2point(size);
    var end = val.first;

    path.moveTo(end[0], end[1]);

    val.skip(1).forEach((p) {
      path.lineTo(p[0], p[1]);
    });

    path.lineTo(end[0], end[1]);
    path.close();

    return path;
  }
  Path getEllipse(size) {
    Path path = Path();

    Map obj = value2Oval(size);

    List position = obj['position'];
    List radius = obj['radius'];
    Rect rect = Rect.fromPoints(Offset(position[0] - radius[0], position[1] - radius[1]), Offset(position[0] + radius[0], position[1] + radius[1]));

    path.addOval(rect); //x, y, w, h
    path.close();

    return path;
  }
  Path parsePath(size) {
    String val = value.substring(6, value.length - 2);
    Path p = parseSvgPathData(val);

    p = p.transform(Float64List.fromList(
      [1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1 / unit]));

    return p;
  }
  @override
  Path getClip(Size size) {
    if (value.substring(0, 5) == 'path(') return parsePath(size);
    
    Path path = value.substring(0, 7) == 'polygon' ? getPolygon(size) : getEllipse(size);

    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) {
    return true;
  }
}

class Flutterclipper extends CustomClipper<Path>{
  final value;
  Flutterclipper(this.value);
  
  @override
  Path getClip(Size size) {
    Path p = parseSvgPathData(value);

    p = p.transform(Float64List.fromList(
      [1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1 / unit]));

    return p;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) {
    return true;
  }
}

class IFShadowChipper extends CustomClipper<Path> {
  final value;
  IFShadowChipper(this.value);
  
  @override
  Path getClip(Size size) {
    final Rect rectInner = Rect.fromLTWH(
      0, 
      0, 
      size.width,
      size.height
    );

    Path path = Path();

    path.addRRect(
      RRect.fromRectAndCorners(rectInner,
        topLeft: Radius.circular(value[0]),
        topRight: Radius.circular(value[1]),
        bottomRight: Radius.circular(value[2]),
        bottomLeft: Radius.circular(value[3]),
      )
    );

    path.addRect(Rect.fromLTRB(
      -deviceWidth, 
      -deviceHeight, 
      deviceWidth * 2,
      deviceHeight * 2
    ));

    path.fillType = PathFillType.evenOdd;

    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) {
    return true;
  }
}