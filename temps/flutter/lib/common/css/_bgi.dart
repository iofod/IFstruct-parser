part of '../style.dart';

calcBackgroundImage(style) {
  var bgi = style['backgroundImage'];
  
  if (bgi == null) return null;
  if (!bgi.contains('url(')) return null;

  String position = style['backgroundPosition'] ?? 'center top';
  String size = style['backgroundSize'] ?? 'cover';
  String img = bgi.replaceAll('""', '').replaceAll("'", '');
  String url = img.substring(4, img.length - 1);

  if (url.isEmpty) return null;

  BoxFit fit = getBoxFit(size);
  Alignment align = CSSPosition.parsePosition(position);

  DecorationImage tree = url.contains('://')
      ? DecorationImage(image: NetworkImage(url), fit: fit, alignment: align)
      : DecorationImage(image: AssetImage((isWeb ? '' : 'assets/') + url), fit: fit, alignment: align);

  return tree;
}