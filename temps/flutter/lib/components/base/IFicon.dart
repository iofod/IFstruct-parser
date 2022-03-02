part of '../ui.dart';

class IFiconPainter extends CustomPainter {
  IFiconPainter({ required this.paths, required this.color, required this.rect, required this.viewBox });
  final String paths;
  final Color color;
  final List rect;
  final List viewBox;

  @override
  bool shouldRepaint(IFiconPainter oldDelegate) =>
      oldDelegate.paths != paths || oldDelegate.color != color || oldDelegate.rect != rect;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    // The mechanism is similar to iofod, where the scaling is based on the smallest edge and the longest edge is centered.
    double w = rect[0];
    double h = rect[1];
    bool useH = w > h;
    double sf = useH ? h : w; // Scaling reference.

    double k1 = double.parse(viewBox[2]);
    double k2 = double.parse(viewBox[3]);
    double s1 = sf / k1;
    double s2 = sf / k2;
    double d1 = (1 - s1) * k1 / 2;
    double d2 = (1 - s2) * k2 / 2;
    double vx = double.parse(viewBox[0]);
    double vy = double.parse(viewBox[1]);

    if (useH) {
      canvas.translate(w / 2.0 - k2 / 2.0 + d2 - vx * s2, 0.0 - vy * s2);
      canvas.scale(s2, s2);
    } else {
      canvas.translate(0.0 - vx * s1, h / 2.0 - k1 / 2.0 + d1 - vy * s1);
      canvas.scale(s1, s1);
    }

    Paint ctx = Paint()
        ..color = color
        ..style = PaintingStyle.fill;

    paths.split("|").forEach((p) {
      canvas.drawPath(
        parseSvgPathData(p),
        ctx
      );
    });

    canvas.restore();
  }
  // @override
  // bool hitTest(Offset position) => path.contains(position);
}

Widget baseIcon(Config config, slo) {
  var style = config.style;

  var color = style['color'] ?? Colors.black;

  double pdx = style['pdx'] ?? 0.0;
  double pdy = style['pdy'] ?? 0.0;
  double W = style['width'] - pdx;
  double H = style['height'] - pdy;

  Widget tree = CustomPaint(
    painter: IFiconPainter(paths: GET(config, 'd'), color: color, rect: [W, H], viewBox: GET(config, 'viewBox').split(' '))
  );

  return componentWrap(config, tree);
}