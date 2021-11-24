part of '../ui.dart';

class IFiconPainter extends CustomPainter {
  IFiconPainter({ this.paths, this.color, this.rect });
  final String paths;
  final Color color;
  final List rect;

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
    double k = 48; // path default in iofod, TODO: processed according to viewBox.
    double s = sf / k;
    double d = (1 - s) * k / 2; // Scaling diff.

    // Center first, then zoom in and subtract the zoom difference.
    if (useH) {
      canvas.translate(w / 2.0 - k / 2.0 + d, 0.0);
    } else {
      canvas.translate(0.0, h / 2.0 - k / 2.0 + d);
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

  var color = style['color'] ?? Colors.black;
  
  double W = style['width'] - (style['pdx'] ?? 0);
  double H = style['height'] - (style['pdy'] ?? 0);

  Widget tree = CustomPaint(
    painter: IFiconPainter(paths: GET(config, 'd'), color: color, rect: [W, H])
  );

  return componentWrap(config, tree);
}