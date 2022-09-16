part of '../ui.dart';

Widget baseContainer(Config config, slot) {
  var style = config.style;

  bool isScrollX = style['overflowX'] == 'auto';
  bool isScrollY = style['overflowY'] == 'auto';

  if (isScrollX || isScrollY) {
    Widget padding = ContainerPadding(hid: config.hid, axis: isScrollY ? 'y' : isScrollX ? 'x' : '');

    slot[1].add(padding);

    Widget body = calcLayout(config, slot);

    if (useAuto) setScrollListener(config);

    return componentWrap(config, SingleChildScrollView(
      scrollDirection: isScrollX ? Axis.horizontal : Axis.vertical,
      controller: config.controller,
      child: body
    ));
  }

  Widget body = calcLayout(config, slot);

  return componentWrap(config, body, false);
}
