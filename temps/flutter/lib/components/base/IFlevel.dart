part of '../ui.dart';

wrapDefaultTextStyle(tree) {
  return DefaultTextStyle(
    style: const TextStyle(
      color: Colors.black,
      fontSize: 20.0,
    ),
    softWrap: true,
    textAlign: TextAlign.start,
    child: tree,
  );
}

Widget baseLevel(Config config, slot) {
  slot[1].insert(0, LevelPadding(hid: config.hid));

  Widget content = calcLayout(config, slot);

  Widget tree = componentWrap(config, Scrollbar(child: SingleChildScrollView(child: content )), false);

  tree = wrapDefaultTextStyle(tree);

  return bindEvent(tree, config);
}