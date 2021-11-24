import 'dart:ui';

import 'package:flutter/material.dart';
import './mixin.dart';
import 'css/position.dart';
import 'dart:math' as math;

part 'css/_flex.dart';
part 'css/_clipPath.dart';
part 'css/_border.dart';
part 'css/_bgi.dart';
part 'css/_gradient.dart';
part 'css/_BoxShadow.dart';
part 'css/_text.dart';
part 'css/_filter.dart';
part 'css/color.dart';

//from kraken ...element/img.dart
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
      return BoxFit.contain; //默认为 contain
  }
}