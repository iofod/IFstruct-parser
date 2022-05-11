part of '../ui.dart';

Widget baseText(Config config, slo) {
  var style = config.style;

  double fontSize = style['fontSize'] ?? rpx(20.0);
  double lineHeight = style['lineHeight'] ?? rpx(22.0);

  TextAttr attr = TextAttr(style);

  Widget tree = Text(
    GET(config, 'msg') ?? '',
    style: TextStyle(
      color: attr.color, 
      fontFamily: attr.fontFamily,
      fontSize: fontSize,
      height: calcLineHeight(lineHeight, fontSize),
      decoration: attr.textDecoration,
      fontStyle: attr.fontStyle,
      fontWeight: attr.fontWeight,
      letterSpacing: attr.letterSpacing,
      shadows: attr.textShadow
    ),
    textAlign: attr.textAlign,
  );
  return componentWrap(config, tree);
}