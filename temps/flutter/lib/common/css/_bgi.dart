part of '../style.dart';

calcBackgroundImage(style) {
  var bgi = style['backgroundImage'];
  
  if (bgi == null) return null;
  if (!bgi.contains('url(')) return null;

  var position = style['backgroundPosition'] ?? 'center center';
  var size = style['backgroundSize'] ?? 'fill';
  var img = bgi.replaceAll('""', '').replaceAll("'", '');
  var url = img.substring(4, img.length - 1);

  if (url.length < 1) return null;

  return DecorationImage(
    fit: getBoxFit(size),
    alignment: CSSPosition.parsePosition(position),
    image: NetworkImage(url)
  );
}