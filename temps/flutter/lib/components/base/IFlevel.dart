part of '../ui.dart';

Widget baseLevel(Config config, slot) {
  if (config.hid == 'Global') {
    return bindEvent(calcLayout(config, slot), config);
  }

  slot[1].add(LevelPadding(hid: config.hid));

  Widget content = calcLayout(config, slot);

  Widget tree = componentWrap(config, Scrollbar(
          child: SingleChildScrollView(
              child: content
              )), false);

  tree = DefaultTextStyle(
    style: TextStyle(
      color: Colors.black,
      fontSize: 20.0,
    ),
    softWrap: true,
    textAlign: TextAlign.start,
    child: tree,
  );

  return bindEvent(tree, config);
}