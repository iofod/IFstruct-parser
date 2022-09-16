import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:math';
import 'package:url_launcher/url_launcher.dart';
import 'package:myapp/common/observer.dart';
import 'package:path_drawing/path_drawing.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:myapp/common/mixin.dart';
import '../common/style.dart';
import '../store/index.dart';
import 'CL.dart';
import '../common/FN.dart';
import '../components/levelPadding.dart';
import '../components/containerPadding.dart';
import '../components/innerShadow.dart';
import '../components/mockBorder.dart';
import './type.dart';
import '../common/UT.dart';
import '../common/_sdk.dart';
import '../common/SDK.dart';

part 'base/_ui_helper.dart';
part 'base/IFlevel.dart';
part 'base/IFcontainer.dart';
part 'base/IFmirror.dart';
part 'base/IFphoto.dart';
part 'base/IFtext.dart';
part 'base/IFlink.dart';
part 'base/IFicon.dart';
part 'base/IFinput.dart';
part 'base/IFhtml.dart';
part 'base/IFiframe.dart';
part 'base/IFvideo.dart';
part 'base/IFpadding.dart';
part 'base/IFexterior.dart';

Map scrollMap = {};

setScrollListener(config) {
  ScrollController controller = config.controller;
  String pn = config.hid + config.clone;

  if (scrollMap[pn] == null) {
    scrollMap[pn] = PS.subscribe('vscrollTo:' + pn, (v) {
      controller.animateTo(v, duration: const Duration(milliseconds: 300), curve: Curves.fastOutSlowIn);
    });
  }
}

Widget componentWrap(Config config, child, [usePadding = true]) {
  var style = config.style;
  var hid = config.hid;
  var curve = style['curve'] ?? 'linear';
  var boxShadow = style['boxShadow'];
  var boxShadows = style['boxShadows'];

  int during = (style['during'] ?? 0.0).round();

  String defaultShadow = '0px 0px 0px 0px #000';
  String defaultInnerShadow = defaultShadow + ' inset';
  // DecoratedBoxTransition
  BoxDecoration deco = BoxDecoration(
    color: style['backgroundColor'],
    gradient: calcGradient(style),
    borderRadius: style['borderRadius'],
  );

  BoxDecoration boxShadowDeco = BoxDecoration(
    borderRadius: style['borderRadius'],
    boxShadow: (boxShadow != null && !boxShadow.contains(defaultShadow + ','))
    ? [...boxShadows.reversed.toList().map((bd) => genBoxShadow(bd, 'outer')).toList()]
    : null,
  );

  double W = style['width'];
  double H = style['height'];

  Widget wrap = AnimatedContainer(
    curve: parseBezier(curve),
    duration: Duration(milliseconds: during),
    width: W,
    height: H,
    padding: usePadding ? style['padding'] ?? $zeroEdge : null,
    decoration: BoxDecoration(
      borderRadius: style['borderRadius'],
    ),
    clipBehavior: style['overflow'] == 'visible' ? Clip.none : Clip.antiAlias,
    child: child,
  );

  if (!style['ghost']) {
    wrap = bindEvent(wrap, config);
  }

  if (style['borderWidths'] != null) {
    // solid only
    wrap = Mockborder(
      color: style['borderColor'] ?? Colors.black,
      borderWidths: style['borderWidths'],
      radius: style['borderRadiusValue'],
      child: wrap
    );
  }

  if (boxShadow != null) {
    boxShadows.forEach((bd) {
      if (!bd.contains(defaultInnerShadow)) {
        Map shadowConf = calcBoxShadow(bd, 'inner');

        wrap = InnerShadow(
          color: shadowConf['color'],
          offset: shadowConf['offset'],
          blur: shadowConf['blur'],
          spead: shadowConf['spead'],
          borderWidths: style['borderWidths'],
          radius: style['borderRadiusValue'],
          child: wrap
        );
      }
    });
  }

  Widget decoWrap = AnimatedContainer(
    curve: parseBezier(curve),
    duration: Duration(milliseconds: during),
    margin: calcBorderWidthsMargin(style),
    decoration: BoxDecoration(
      image: calcBackgroundImage(style),
    ),
    child: wrap,
  );

  wrap = AnimatedContainer(
    curve: parseBezier(curve),
    duration: Duration(milliseconds: during),
    width: style['rectWidth'],
    height: style['rectHeight'],
    decoration: deco,
    clipBehavior: style['overflow'] == 'visible' ? Clip.none : Clip.antiAlias,
    child: decoWrap
  );

  if (boxShadow != null) {
    wrap = Stack(
      children: [
        ClipPath(
          clipper: IFShadowChipper(style['borderRadiusValue']),
          child: AnimatedContainer(
            curve: parseBezier(curve),
            duration: Duration(milliseconds: during),
            width: style['rectWidth'],
            height: style['rectHeight'],
            decoration: boxShadowDeco,
            clipBehavior: Clip.antiAlias,
            child: $padding
          )
        ),
        wrap
      ]
    );
  }

  var filter = style['filter'];
  if (filter is Map) {
    wrap = calcFilter(filter, wrap);
  }

  var backdropFilter = style['backdropFilter'];

  if (backdropFilter is Map) {
    List<Widget> backdropLevels = calcBackdropFilter(backdropFilter, style);

    // This is similar to the web, where filters should also be reflected in the backdrop if they are also present
    if (filter is Map) {
      backdropLevels.addAll(calcBackdropFilter(filter, style));
    }

    wrap = Stack(
      children: [
        Container(
          width: W,
          height: H,
          decoration: BoxDecoration(
            borderRadius: style['borderRadius'],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: backdropLevels,
          ),
        ),
        wrap
      ],
    );
  }

  // Cropping is done after the binding event, so that the cropped content is not visible to the pointer
  if (style['clipPath'] != null) {
    var clipper = IFclipper(style['clipPath']);

    wrap = ClipPath(
      clipper: clipper,
      child: wrap
    );
  }

  if (style['Flutterclipper'] != null) {
    var clipper = Flutterclipper(style['Flutterclipper']);

    wrap = ClipPath(
      clipper: clipper,
      child: wrap
    );
  }

  Matrix4 baseMatrix = Matrix4.identity();

  if (style['perspectValue'] > 0) {
    baseMatrix.setEntry(3, 2, (1.0 / style['perspectValue']) / unit);
  }

  String transformOrigin = style['transformOrigin'] ?? 'center';

  double scaleX = (style['s'] ?? 100.0) / 100.0;
  double scaleY = scaleX;
  double scaleZ = scaleX;
  double rotateZ = style['rotate'] * pi / 180;
  double rotateX = 0.0;
  double rotateY = 0.0;

  if (style['scaleX'] != null || style['scaleY'] != null || style['scaleZ'] != null) {
    scaleX = doubleIt(style['scaleX'] ?? 100.0) / 100.0;
    scaleY = doubleIt(style['scaleY'] ?? 100.0) / 100.0;
    scaleZ = doubleIt(style['scaleZ'] ?? 100.0) / 100.0;
  }

  if (style['rotateX'] != null || style['rotateY'] != null) {
    rotateX = style['rotateX'] * -1;
    rotateY = style['rotateY'] * -1;
  }

  wrap = AnimatedContainer(
    curve: parseBezier(curve),
    duration: Duration(milliseconds: during),
    margin: style['margin'] ?? $zeroEdge,
    transformAlignment: parseTransformOrigin(transformOrigin),
    transform: baseMatrix
    ..multiply(Matrix4.rotationX(rotateX)
      ..rotateY(rotateY)
      ..rotateZ(rotateZ)
      ..scale(scaleX, scaleY, scaleZ)
      ..translate(style['translateX'], style['translateY'], style['translateZ'])
      )
    ..multiply(Matrix4.skew(style['skewX'], style['skewY']))
    ,
    child: wrap
  );

  if (style['opacity'] != null || style['V'] == false) {
    double opacity = style['V'] == false ? 0.0 : style['opacity'].toDouble();

    wrap = AnimatedOpacity(
      opacity: opacity,
      curve: parseBezier(curve),
      duration: Duration(milliseconds: during),
      child: wrap
    );
  }

  var tag = GET(config, 'tag');

  if (tag != null && tag != '') {
    return position(config, Hero(tag: tag, child: wrap));
  }

  var pretag = $hero.value[hid];
  // It needs to be determined based on clone to prevent confusion caused by multiple heros.
  if (pretag!= null && pretag is String) {
    List arr = pretag.split('__');

    if (config.clone == arr[1]) {
      var a0 = arr[0];

      return position(config, Hero(tag: a0 is String ? a0: 'default', child: wrap));
    }
  }

  return position(config, wrap);
}

Widget calcLayout(Config config, children) {
  Map style = config.style;

  bool isScrollX = style['overflowX'] == 'auto';

  double width = style['width'];
  double height = style['height'];

  if (style['display'] == 'flex') {
    var jcv = style['justifyContent'] ?? 'flex-start';
    var aiv = style['alignItems'] ?? 'flex-start';
    var div = style['flexDirection'] ?? 'row';
    var toward = flexDirection[div];
    bool isWrap = style['flexWrap'] == 'wrap';

    Widget dom = isWrap ? Wrap(
      direction: toward['direction'],
      alignment: justifyContentWrap[jcv],
      crossAxisAlignment: alignItemsWrap[aiv],
      runAlignment: alignContent[style['alignContent'] ?? 'flex-start'],
      textDirection: toward['textDirection'],
      verticalDirection: toward['verticalDirection'],
      children: children[0]
    ) : Flex(
      direction: toward['direction'],
      mainAxisAlignment: justifyContent[jcv],
      crossAxisAlignment: alignItems[aiv],
      textDirection: toward['textDirection'],
      verticalDirection: toward['verticalDirection'],
      children: children[0]
    );

    var limit;

    // If the x-axis is scrolled and flexWrap is not wrap, the container is allowed to be propped horizontally, mainly in line with the web.
    if (isScrollX && !isWrap) {
      limit = BoxConstraints(
        minWidth: width,
        minHeight: height,
        maxHeight: height
      );
    } else {
      limit = BoxConstraints(
        minWidth: width,
        maxWidth: width,
        minHeight: height
      );
    }

    return Stack(
      children: [
        // dom,
        Container(
          padding: style['padding'] ?? $zeroEdge,
          constraints: limit,
          child: dom
        ),
        ...children[1]
      ]
    );
  } else {
    int cl = children[0].length;

    Widget staticBody = cl > 0 ? Container(
      padding: style['padding'] ?? $zeroEdge,
      constraints: BoxConstraints(
        minWidth: width,
        minHeight: height
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children[0],
      )
    ) : $padding;

    return Stack(
      fit: StackFit.loose,
      clipBehavior: style['overflow'] == 'visible' ? Clip.none : Clip.antiAlias,
      children: [
        staticBody,
        ...children[1],
      ]
    );
  }
}

Map baseComponent = {
  'base/level': baseLevel,
  'base/container': baseContainer,
  'base/mirror': baseMirror,
  'base/photo': basePhoto,
  'base/text': baseText,
  'base/link': baseLink,
  'base/icon': baseIcon,
  'base/iframe': baseIframe,
  'base/input': baseInput,
  'base/textarea': baseInput,
  'base/html': baseHTML,
  'base/video': baseVideo,
  'base/exterior': baseExterior,
  'base/canvas': basePadding
};
