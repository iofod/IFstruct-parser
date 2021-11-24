part of '../ui.dart';

Widget basePhoto(Config config, slo) {
  var style = config.style;
  var fit = style['objectFit'] ?? 'contain';

  Widget tree = Image(image: NetworkImage(GET(config, 'url')), fit: getBoxFit(fit), alignment: Alignment.center);

  return componentWrap(config, tree);
}