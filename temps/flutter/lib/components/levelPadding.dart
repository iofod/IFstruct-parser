import 'package:flutter/material.dart';
import '../store/index.dart';
import '../common/mixin.dart';
import '../common/FN.dart';
import 'dart:math' as math;

class LevelPadding extends StatefulWidget {
  final String hid;
  LevelPadding({ required this.hid });
  @override
  _LevelPaddingState createState() => _LevelPaddingState();
}

class _LevelPaddingState extends State<LevelPadding> {
  double scrollHeight = 0.0;
  bool isBuild = false;
  calcScroll() {
    if (isBuild) return;

    isBuild = true;

    var hid = widget.hid;
    var scrollBody = $scrollBody[hid];

    PS.unsubscribe('change_scroll_$hid');
    PS.subscribe('change_scroll_$hid', (_) {
      if (routerFlying) {
        return setTimeout(() {
          PS.publish('change_scroll_$hid');
        }, 500);
      } // The route switching process ignores the scroll height correction

      setState(() {
        double s = 0.0;

        scrollBody['s'].forEach((_, value) {
          if (value > s) {
            s = value;
          }
        });
        scrollHeight = s;
      });
    });
  }
  @override
  Widget build(BuildContext context) {
    calcScroll();

    var hid = widget.hid;

    return Container(
      constraints: BoxConstraints.tightFor(width: 1.0, height: math.max(scrollHeight, deviceHeight - FN.GET_MODEL(hid)('_StatusBarHeight'))) // The minimum height is deviceHeight.
    );
  }
}