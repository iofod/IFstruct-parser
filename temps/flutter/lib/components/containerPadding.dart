import 'package:flutter/material.dart';
import '../store/index.dart';
import '../common/FN.dart';

class ContainerPadding extends StatefulWidget {
  final String hid;
  final String axis;
  ContainerPadding({ required this.hid, required this.axis });
  @override
  _ContainerPaddingState createState() => _ContainerPaddingState();
}

class _ContainerPaddingState extends State<ContainerPadding> {
  double scrollHeight = 0.0;
  double scrollWidth = 0.0;
  bool isBuild = false;
  calcScroll() {
    if (isBuild) return;

    isBuild = true;

    var hid = widget.hid;
    var scrollBody = $scrollBody[hid];
    PS.unsubscribe('change_scroll_$hid');
    PS.subscribe('change_scroll_$hid', (_) {
        setState(() {
          double s = 0.0;
          double r = 0.0;

          scrollBody['s'].forEach((_, value) {
            if (value > s) {
              s = value;
            }
          });
          scrollBody['r'].forEach((_, value) {
            if (value > r) {
              r = value;
            }
          });

          scrollHeight = s;
          scrollWidth =  r;
        });
    });
  }
  @override
  Widget build(BuildContext context) {
    calcScroll();
    var axis = widget.axis;

    if (axis == 'x') {
      return Container(
        constraints: BoxConstraints.tightFor(width: scrollWidth, height: 1.0) 
      );
    } else {
      return Container(
        constraints: BoxConstraints.tightFor(width: 1.0, height: scrollHeight + 1.0) 
      );
    }

  }
}