import 'package:flutter/material.dart';
import '../components/renderTree.dart';
import '../store/index.dart';

final viewCache = {};

initView(pageid) {
  var target = $struct[pageid];

  List<Widget> calc = [];

  target['children'].forEach((lid) {
    var level = $struct[lid];

    if (level['ghost'] == true) {
      level['children'].forEach((hid) {
        var sub;
        if (viewCache[hid] == null) {
          sub = ComponentTree(hid: hid, clone: '');

          viewCache[hid] = sub;
        } else {
          sub = viewCache[hid];
        }

        calc.add(sub);
      });
    } else {
      var sub;
      
      if (viewCache[lid] == null) {
        sub = ComponentTree(hid: lid, clone: '');

        viewCache[lid] = sub;
      } else {
        sub = viewCache[lid];
      }

      calc.add(sub);
    }
  });

  return calc;
}