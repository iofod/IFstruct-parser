part of '../ui.dart';

final keyboardTypeMap = {
  'password':  TextInputType.text,
  'text': TextInputType.text,
  'number': TextInputType.number,
  'email': TextInputType.emailAddress,
  'phone': TextInputType.phone
};

Widget position(config, dom) {
  var style = config.style;
  var posi = $position[config.hid + config.clone];

  var during = style['during'].round();
  var curve = style['curve'] ?? 'linear';

  if (posi == 'static') return dom;

  return AnimatedPositioned(curve: parseBezier(curve),
    duration: Duration(milliseconds: during), 
    child: dom, left: style['x'], top: style['y']);
}

final overlayMap = {};
//https://pub.dev/packages/flutter_overlay_loader
class Level extends StatelessWidget {
  Level._(this._render);
  final Widget _render;
  static OverlayState? _overlayState;
  static void setOverlay(BuildContext context, Widget content) {
    _overlayState = Overlay.of(context)!;

    OverlayEntry box = OverlayEntry(
      builder: (context) {
        return Level._(content);
      }
    );

    try {
      WidgetsBinding.instance?.addPostFrameCallback(
        (_) => _overlayState?.insert(box));
    } catch (e) {}
  }
  @override
  Widget build(BuildContext context) {
    return _render;
  }
}

final hackLineHeight = 1 / 2;

// height = lineHeight / fontSize 
// Here we will do the hack first and wait for the official flutter solution.
double calcLineHeight(double lineHeight, double fontSize) {
  return (lineHeight + fontSize * hackLineHeight) / ((1.0 + hackLineHeight) * fontSize);
}

class TextAttr {
  late Map style;
  late Color color;
  late double letterSpacing;
  late TextDecoration textDecoration;
  late FontStyle fontStyle;
  late FontWeight fontWeight;
  late TextAlign textAlign;
  late String fontFamily;
  var textShadow;
  TextAttr(style) {
    this.style = style;
    color = style['color'] ?? Colors.black;
    letterSpacing = style['letterSpacing'] ?? 1.0;
    textDecoration = itextDecoration[style['textDecoration']] ?? TextDecoration.none;
    fontStyle = ifontStyle[style['fontStyle']] ?? FontStyle.normal;
    fontWeight = ifontWeight[style['fontWeight']] ?? FontWeight.w400;
    textAlign = itextAlign[style['textAlign']] ?? TextAlign.left;
    textShadow = style['textShadow'] != null ? [genTextShadow(style['textShadow'])] : null;
    fontFamily = style['fontFamily'] ?? $gft;
  }
}


