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
    double vw = double.parse(viewBox[2]);
    double vh = double.parse(viewBox[3]);

    bool useH = w == h ? vw < vh : w > h; //In the case of equivalence, the larger side shall prevail.

    double sf = useH ? h : w; // Scaling reference.
    double s = useH ? sf / vh : sf / vw;
    double dw = (1 - s) * vw / 2;
    double dh = (1 - s) * vh / 2;
    double vx = double.parse(viewBox[0]) * s;
    double vy = double.parse(viewBox[1]) * s;

    if (useH) {
      canvas.translate(w / 2.0 - vw / 2.0 + dw - vx, 0.0 - vy);
    } else {
      canvas.translate(0.0 - vx, h / 2.0 - vh / 2.0 + dh - vy);
    }

    canvas.scale(s, s);

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

  var color = style['fill'] ?? Colors.black;

  double pdx = style['pdx'] ?? 0.0;
  double pdy = style['pdy'] ?? 0.0;
  double W = style['width'] - pdx;
  double H = style['height'] - pdy;

  Widget tree = CustomPaint(
    painter: IFiconPainter(paths: GET(config, 'd'), color: color, rect: [W, H], viewBox: GET(config, 'viewBox').split(' '))
  );

  return componentWrap(config, tree);
}