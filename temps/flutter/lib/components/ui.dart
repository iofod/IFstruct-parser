import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:matrix4_transform/matrix4_transform.dart';
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


Widget componentWrap(Config config, child, [usePadding = true]) {
  var style = config.style;
  var hid = config.hid;
  var curve = style['curve'] ?? 'linear';
  var boxShadow = style['boxShadow'];
  var boxShadows = style['boxShadows'];

  int during = style['during'].round();

  String defaultShadow = '0px 0px 0px 0px #000';
  String defaultInnerShadow = defaultShadow + ' inset';
  // DecoratedBoxTransition
  BoxDecoration deco = BoxDecoration(
    color: style['backgroundColor'],
    gradient: calcGradient(style),
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

  var rotate = style['rotate'] / 1.0;
  var scale = style['s'] / 100.0;

  Widget decoWrap = AnimatedContainer(
    curve: parseBezier(curve),
    duration: Duration(milliseconds: during),    
    margin: calcBorderWidthsMargin(style['borderWidths']),
    decoration: BoxDecoration(
      image: calcBackgroundImage(style),
    ),
    child: wrap,
  );

  Offset tfo = Offset(style['rectWidth'] / 2, style['rectHeight'] / 2);
  
  wrap = AnimatedContainer(
    curve: parseBezier(curve),
    duration: Duration(milliseconds: during),
    width: style['rectWidth'],
    height: style['rectHeight'],
    decoration: deco,
    clipBehavior: Clip.antiAlias,
    child: decoWrap
  );

  var filter = style['filter'];
  if (filter is Map) {
    wrap = calcFilter(filter, wrap);
  }

  // Cropping is done after the binding event, so that the cropped content is not visible to the pointer
  if (style['clipPath'] != null) {
    var clipper = IFclipper(style['clipPath']);

    wrap = ClipPath(
      clipper: clipper,
      child: wrap
    );
  }

  wrap = AnimatedContainer(
    curve: parseBezier(curve),
    duration: Duration(milliseconds: during),
    margin: style['margin'] ?? $zeroEdge,
    transform: Matrix4Transform()
        .rotateDegrees(rotate, origin: tfo)
        .scale(scale, origin: tfo)
        .matrix4,
    child: wrap
  );

  var backdropFilter = style['backdropFilter'];

  if (backdropFilter is Map) {
    wrap = calcBackdropFilter(backdropFilter, wrap, style);
  }

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
  var style = config.style;

  bool isScrollX = style['overflowX'] == 'auto';
  bool isScrollY = style['overflowY'] == 'auto';

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

    Widget content = Stack(
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

    if (isScrollX) {
      return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: content);
    }
    else if (isScrollY) {
      return SingleChildScrollView(
      scrollDirection: Axis.vertical,
      child: content);
    } else {
      return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: content);
    }
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

    Widget scrollWrap = isScrollX ? SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: staticBody
    ) : (
      isScrollY ? 
      SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: staticBody
      ) :
      SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: staticBody
      )
    );
    return Stack(
      fit: StackFit.loose,
      children: [
        scrollWrap,
        ...children[1]
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
  'base/video': baseVideo
};