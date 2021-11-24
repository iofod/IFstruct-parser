part of '../style.dart';

Map justifyContent = {
  'flex-start': MainAxisAlignment.start,
  'center': MainAxisAlignment.center,
  'flex-end': MainAxisAlignment.end,
  'space-around': MainAxisAlignment.spaceAround,
  'space-between': MainAxisAlignment.spaceBetween,
  'space-evenly': MainAxisAlignment.spaceEvenly
};

Map justifyContentWrap = {
  'flex-start': WrapAlignment.start,
  'center': WrapAlignment.center,
  'flex-end': WrapAlignment.end,
  'space-around': WrapAlignment.spaceAround,
  'space-between': WrapAlignment.spaceBetween,
  'space-evenly': WrapAlignment.spaceEvenly
};

Map alignContent = {
  'flex-start': WrapAlignment.start,
  'center': WrapAlignment.center,
  'flex-end': WrapAlignment.end,
  'space-around': WrapAlignment.spaceAround,
  'space-between': WrapAlignment.spaceBetween,
  'space-evenly': WrapAlignment.spaceEvenly
};

Map alignItems = {
  'flex-start': CrossAxisAlignment.start,
  'center': CrossAxisAlignment.center,
  'flex-end': CrossAxisAlignment.end,
  'baseline': CrossAxisAlignment.baseline,
  'stretch': CrossAxisAlignment.stretch
};

Map alignItemsWrap = {
  'flex-start': WrapCrossAlignment.start,
  'baseline': WrapCrossAlignment.start, // Awaiting official realization.
  'center': WrapCrossAlignment.center,
  'stretch': WrapCrossAlignment.center, // Awaiting official realization.
  'flex-end': WrapCrossAlignment.end,
};

Map flexDirection = {
  'row': {
    'direction': Axis.horizontal,
    'textDirection': TextDirection.ltr,
    'verticalDirection': VerticalDirection.down
  },
  'row-reverse': {
    'direction': Axis.horizontal,
    'textDirection': TextDirection.rtl,
    'verticalDirection': VerticalDirection.down
  },
  'column': {
    'direction': Axis.vertical,
    'textDirection': TextDirection.ltr,
    'verticalDirection': VerticalDirection.down
  },
  'column-reverse': {
    'direction': Axis.vertical,
    'textDirection': TextDirection.ltr,
    'verticalDirection': VerticalDirection.up
  }
};