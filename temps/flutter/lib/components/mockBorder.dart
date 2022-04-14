import 'dart:math' as math;
import 'dart:ui';
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
      iw.round().toDouble(),
      ih.round().toDouble()
    );

    final Paint shadowPaint = Paint();
    
    shadowPaint.style = PaintingStyle.stroke;
    
    var canvas = context.canvas;

    double k = 1.0;
    List borderRadius = [0.0, 0.0, 0.0, 0.0];

    Set s1 = new Set();

    s1.addAll(radius);

    if (radius.length < 1 || s1.length == 1) {
      borderRadius[0] = borderRadius[1] = borderRadius[2] = borderRadius[3] = radius[0] - math.max(bl, bt) / k;
    } else {
      borderRadius[0] = radius[0] - math.max(bl, bt) / k;
      borderRadius[1] = radius[1] - math.max(bt, br) / k;
      borderRadius[2] = radius[2] - math.max(br, bb) / k;
      borderRadius[3] = radius[3] - math.max(bb, bl) / k;
    }

    var borderSides = borderRadius.map((v) {
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

    canvas.drawPath(path, shadowPaint);
    context.paintChild(child!, offset);
    context.canvas.restore();
  }
}

calcBorderWidthsMargin(borderWidths) {
  if (borderWidths == null) return null;

  double ml = borderWidths[3];
  double mr =  borderWidths[1];
  double mt = borderWidths[0];
  double mb =  borderWidths[2];

  return EdgeInsets.only(left: ml, right: mr, top: mt, bottom: mb);
}