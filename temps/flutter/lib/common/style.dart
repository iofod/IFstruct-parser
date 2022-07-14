import 'dart:typed_data';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:css_filter/css_filter.dart';
import 'package:path_drawing/path_drawing.dart';
import 'dart:math' as math;
import './mixin.dart';
import './FN.dart';
import 'css/position.dart';

part 'css/_flex.dart';
part 'css/_clipPath.dart';
part 'css/_border.dart';
part 'css/_bgi.dart';
part 'css/_gradient.dart';
part 'css/_BoxShadow.dart';
part 'css/_text.dart';
part 'css/_filter.dart';
part 'css/color.dart';

BoxFit getBoxFit(String fit) {
  switch (fit) {
    case 'contain':
      return BoxFit.contain;

    case 'cover':
      return BoxFit.cover;

    case 'none':
      return BoxFit.none;

    case 'scaleDown':
    case 'scale-down':
      return BoxFit.scaleDown;

    case 'fitWidth':
    case 'fit-width':
      return BoxFit.fitWidth;

    case 'fitHeight':
    case 'fit-height':
      return BoxFit.fitHeight;

    case 'fill':
      return BoxFit.fill;

    default:
      return BoxFit.contain; // default value is contain
  }
}