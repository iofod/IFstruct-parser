import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:myapp/common/FN.dart';
import '../common/mixin.dart';
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

  return Scaffold(body: Container(
    constraints: const BoxConstraints.expand(),
    color: $bg,
    child: Stack(
      children: calc
  )));
}

setStatusBar(pageid) {
  var target = $struct[pageid];
  var $item = $sets[pageid].value;
  var status = $item['status'].value;
  var activeList = [];

  status.forEach((statu) {
    if (statu.value['active']) {
      activeList.add(statu.value);
    }
  });

  var state = activeList[0];
  var style = state['style'].value;

  bool isHideStatusBar = style['hideStatusBar'];

  target['children'].forEach((lid) {
    $statusBarState.value[lid] = isHideStatusBar;
  });

  $statusBarState.value['Global'] = isHideStatusBar;

  setTimeout(() {

    if (isHideStatusBar) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: [SystemUiOverlay.bottom]);
    } else {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom]);

      Brightness theme = style['statusBarTheme'] == 'light' ? Brightness.dark : Brightness.light;

      SystemUiOverlayStyle systemUiOverlayStyle = SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: theme, statusBarIconBrightness: theme);
      SystemChrome.setSystemUIOverlayStyle(systemUiOverlayStyle);
    }
  }, 17);
}