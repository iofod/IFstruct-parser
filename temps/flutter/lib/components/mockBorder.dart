import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:myapp/common/mixin.dart';

class Mockborder extends SingleChildRenderObjectWidget {
  const Mockborder({
    this.radius,
    this.borderWidths,
    this.color = Colors.black38,

    this.offset = const Offset(0.0, 0.0),
    required Widget child,
  }) : super(child: child);

  final Color color;
  final Offset offset;
  final radius;
  final borderWidths;

  @override
  RenderObject createRenderObject(BuildContext context) {
    final _RenderMockborder renderObject = _RenderMockborder();
    updateRenderObject(context, renderObject);
    return renderObject;
  }

  @override
  void updateRenderObject(BuildContext context, _RenderMockborder renderObject) {
    renderObject
      ..color = color
      ..dx = offset.dx
      ..radius = radius
      ..borderWidths = borderWidths
      ..dy = offset.dy;
  }
}

class _RenderMockborder extends RenderProxyBox {
  Color color = Colors.black;
  double dx = 0.0;
  double dy = 0.0;
  List radius = [];
  List borderWidths = [];
  final k = 0.0;

  @override
  void paint(PaintingContext context, Offset offset) {
    if (child == null) return;

    context.canvas.save();

    double bt = borderWidths[0];
    double br = borderWidths[1];
    double bb = borderWidths[2];
    double bl = borderWidths[3];

    double iw = size.width;
    double ih = size.height;

    final Rect rectInner = Rect.fromLTWH(
      offset.dx + dx,
      offset.dy + dy,
      iw,
      ih
    );

    final Paint shadowPaint = Paint();

    shadowPaint.style = PaintingStyle.stroke;

    Canvas canvas = context.canvas;

    List borderRadius = [0.0, 0.0, 0.0, 0.0];

    Set s1 = {};

    s1.addAll(radius);

    if (radius.isEmpty || s1.length == 1) {
      borderRadius[0] = borderRadius[1] = borderRadius[2] = borderRadius[3] = radius[0] + amendValue(bl, bt);
    } else {
      borderRadius[0] = radius[0] + amendValue(bl, bt);
      borderRadius[1] = radius[1] + amendValue(bt, br);
      borderRadius[2] = radius[2] + amendValue(br, bb);
      borderRadius[3] = radius[3] + amendValue(bb, bl);
    }

    List borderSides = borderRadius.map((v) {
      return Radius.circular(v);
    }).toList();

    shadowPaint
      ..style = PaintingStyle.fill
      ..color = color;

    Path path = Path();
    path.addRRect(
      RRect.fromRectAndCorners(rectInner,
        topLeft: borderSides[0],
        topRight: borderSides[1],
        bottomRight: borderSides[2],
        bottomLeft: borderSides[3],
      )
    );

    path.addRect(Rect.fromLTRB(
      0.0,
      0.0,
      deviceWidth,
      deviceHeight
    ));

    path.fillType = PathFillType.evenOdd;

    final Rect rectOuter = Rect.fromLTWH(
      offset.dx - bl,
      offset.dy - bt,
      iw + bl + br,
      ih + bt + bb
    );

    Path clip = Path();

    clip.addRRect(
      RRect.fromRectAndCorners(rectOuter,
        topLeft: Radius.circular(radius[0]),
        topRight: Radius.circular(radius[1] ?? radius[0]),
        bottomRight: Radius.circular(radius[2] ?? radius[0]),
        bottomLeft: Radius.circular(radius[3] ?? radius[0]),
      )
    );

    canvas.clipPath(clip);

    canvas.drawPath(path, shadowPaint);

    context.canvas.restore();
    context.paintChild(child!, offset);
  }
}

calcBorderWidthsMargin(style) {
  if (style['borderWidths'] == null) return null;

  List borderWidths = style['borderWidths'];

  return EdgeInsets.only(left: borderWidths[3], right: borderWidths[1], top: borderWidths[0], bottom: borderWidths[2]);
}
