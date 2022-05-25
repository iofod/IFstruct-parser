part of '../style.dart';

// Currently, only solid is officially supported.
Map borderTypeMap = {
  'solid': BorderStyle.solid,
  'dotted': BorderStyle.solid,
  'dashed': BorderStyle.solid,
  'double': BorderStyle.solid,
  'groove': BorderStyle.solid,
};

BorderSide borderSide(width, type, color) {
  color ??= '#000000';
  type ??= 'solid';
  if (width > 0) {
    return BorderSide(
        color: tfColor(color), width: width, style: borderTypeMap[type]);
  } else {
    return const BorderSide(
        color: Color(0x00000000), width: 0.0, style: BorderStyle.none);
  }
}

genborder(border) {
  if (border != null) {
    if (border['all'] != null) {
      return border['all'];
    } else {
      return Border(
        top: border['top'],
        right: border['right'],
        bottom: border['bottom'],
        left: border['left'],
      );
    }
  } else {
    return null;
  }
}
