import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_mobx/flutter_mobx.dart';
import '../common/FN.dart';
import '../common/mixin.dart';
import '../components/auto/index.dart';
import '../components/renderTree.dart';
import '../store/index.dart';
import '../router.dart';

final viewCache = {};

calcLevel(lid, List<Widget> calc) {
  var level = $struct[lid];

  if (level['ghost'] == true) {
    level['children'].forEach((hid) {
      var sub;
      if (viewCache[hid] == null) {
        if (level['useSafeArea'] && $statusBarState.value[lid] == false) {
          $safePosition[hid] = true;
        }

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
}

calcGlobalLevel() {
  List<Widget> calc = [];

  calcLevel('Global', calc);

  return Stack(
    children: calc
  );
}

previewCursor() {
  return Observer(builder: (_) {
    Map cursor = $Global.value['previewCursor'].value;

    Widget ball = Transform.translate(
      offset: const Offset(5.0, 5.0),
      child: Container(
        width: 20.0,
        height: 20.0,
        decoration: const BoxDecoration(
        color: Color.fromARGB(148, 253, 242, 36),
        borderRadius: BorderRadius.all(Radius.circular(10.0)))
      ),
    );

    return Stack(
      children: [
        cursor['useTransition']
        ? AnimatedPositioned(
          duration: const Duration(milliseconds: 300),
          left: cursor['x'],
          top: cursor['y'],
          child: ball,
        )
        : Positioned(
          left: cursor['x'],
          top: cursor['y'],
          child: ball,
        )
      ],
    );
  });
}

initView(pageid) {
  var target = $struct[pageid];

  List<Widget> calc = [];

  target['children'].forEach((lid) {
    calcLevel(lid, calc);
  });

  return WillPopScope(
    onWillPop: () async {
      await $router.navigateBack(1, false);

      return true;
    },
    child: Scaffold(body: Container(
      constraints: const BoxConstraints.expand(),
      color: $bg,
      child: Stack(
        children: calc
  ))));
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
