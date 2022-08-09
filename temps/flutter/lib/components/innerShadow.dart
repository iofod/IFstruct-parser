// https://stackoverflow.com/questions/54061964/inner-shadow-effect-in-flutter
// https://pub.dev/packages/sums_inner
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:myapp/common/mixin.dart';

class InnerShadow extends SingleChildRenderObjectWidget {
  const InnerShadow({
    this.blur = 0.0,
    this.radius,
    this.borderWidths,
    this.spead = 0.0,
    this.color = Colors.black38,
    this.offset = const Offset(0.0, 0.0),
    required Widget child,
  }) : super(child: child);

  final double blur;
  final double spead;
  final Color color;
  final Offset offset;
  final radius;
  final borderWidths;

  @override
  RenderObject createRenderObject(BuildContext context) {
    final _RenderInnerShadow renderObject = _RenderInnerShadow();
    updateRenderObject(context, renderObject);
    return renderObject;
  }

  @override
  void updateRenderObject(BuildContext context, _RenderInnerShadow renderObject) {
    renderObject
      ..color = color
      ..blur = blur
      ..spead = spead
      ..dx = offset.dx
      ..radius = radius
      ..borderWidths = borderWidths
      ..dy = offset.dy;
  }
}

class _RenderInnerShadow extends RenderProxyBox {
  double blur = 0.0;
  double spead = 0.0;
  Color color = Colors.black;
  double dx = 0.0;
  double dy = 0.0;
  var radius;
  var borderWidths;
  final k = 0.0;

  @override
  void paint(PaintingContext context, Offset offset) {
    if (child == null) return;

    context.canvas.save();

    borderWidths ??= [0.0, 0.0, 0.0, 0.0];

    double iw = size.width - spead * 2.0;
    double ih = size.height - spead * 2.0;

    final Rect rectInner = Rect.fromLTWH(
      offset.dx + spead + dx, 
      offset.dy + spead + dy, 
      iw,
      ih
    );

    double bnn = math.max(dx.abs(), dy.abs());

    final Paint shadowPaint = Paint();
    
    if (blur > 0.0) {
      shadowPaint.imageFilter = ImageFilter.blur(sigmaX: blur / 2.0, sigmaY: blur / 2.0);
    }
    shadowPaint.style = PaintingStyle.stroke;
    
    var canvas = context.canvas;

    radius ??= [0.0, 0.0, 0.0, 0.0];

    List borderSides = radius.map((v) {
      return Radius.circular(v - spead - bnn);
    }).toList();

    shadowPaint
      ..style = PaintingStyle.fill
      ..color = color;

    Path path = Path();
    Path clip = Path();

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
    // Non-zero surround.
    //https://cloud.tencent.com/developer/article/1622941
    path.fillType = PathFillType.evenOdd;

    canvas.drawPath(path, shadowPaint);

    // canvas.restore();
    // final Rect rectOuter = Rect.fromLTWH(
    //   offset.dx + dx, 
    //   offset.dy + dy, 
    //   size.width,
    //   size.height
    // );
    // clip.addRRect(
    //   RRect.fromRectAndCorners(rectOuter,
    //     topLeft: borderSides[0],
    //     topRight: borderSides[1],
    //     bottomRight: borderSides[2],
    //     bottomLeft: borderSides[3],
    //   )
    // );
    // canvas.clipPath(clip);
    
    context.paintChild(child!, offset);
    context.canvas.restore();
  }
}