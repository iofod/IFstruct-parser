part of '../ui.dart';

Widget baseLink(Config config, slo) {
  var style = config.style;

  TextAttr attr = TextAttr(style);

  double fontSize = style['fontSize'] ?? rpx(20.0);

  Widget tree = SizedBox(
    width: style['width'],
    height: style['height'],
    child: GestureDetector(
      behavior: HitTestBehavior.opaque,
    onTap: () async {
      var link = Uri.parse(GET(config, 'link') ?? '');

      log('open $link');
      PS.publishSync('${config.hid+config.clone}-tap', null);

      await canLaunchUrl(link) ? await launchUrl(link, mode: LaunchMode.inAppWebView) : throw 'Could not launch $link';
    },
    child: Text(
      GET(config, 'msg'),
      style: TextStyle(
        color: style['color'] ?? tfColor('#1E88E5'), 
        fontFamily: attr.fontFamily,
        fontSize: fontSize,
        decoration: attr.textDecoration,
        fontStyle: attr.fontStyle,
        fontWeight: attr.fontWeight,
        letterSpacing: attr.letterSpacing,
        shadows: attr.textShadow
      ),
      textAlign: attr.textAlign,
  )));
  return componentWrap(config, tree);
}