part of '../ui.dart';

Widget baseMirror(Config config, slot) {
  Widget body = calcLayout(config, slot);

  return componentWrap(config, body);
}
