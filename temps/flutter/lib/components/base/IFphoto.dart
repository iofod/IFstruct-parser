part of '../ui.dart';

Widget basePhoto(Config config, slo) {
  var style = config.style;

  BoxFit fit = getBoxFit(style['objectFit'] ?? 'contain');
  String url = GET(config, 'url') ?? ''; //Special handling for web mode
  Widget tree = url.contains('://')
      ? Image(image: NetworkImage(url), fit: fit, alignment: Alignment.center)
      : Image(image: AssetImage((isWeb ? '' : 'assets/') + url), fit: fit, alignment: Alignment.center);

  return componentWrap(config, tree);
}
