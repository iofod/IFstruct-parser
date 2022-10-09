part of '../ui.dart';

Widget baseInput(Config config, slo) {
  var style = config.style;
  var value = GET(config, 'value');
  var inputValue = GET(config, 'inputValue');
  var handleInputValue = inputValue;
  var type = GET(config, 'type');
  var hid = config.hid;
  var clone = config.clone;

  bool isTextarea = $struct[hid]['content'] != 'base/input';

  bool disabled = GET(config, 'disabled') == true;
  bool usePassword = type == 'password';
  bool autofocus = GET(config, 'autofocus') == true;
  bool autocomplete = GET(config, 'autocomplete') == true;

  var maxlength = GET(config, 'maxlength');

  if (maxlength is String) {
    maxlength = int.parse(maxlength);
  }
  if (maxlength is double) {
    maxlength = maxlength.toInt();
  }

  double fontSize = style['fontSize'] ?? rpx(16.0);
  double lineHeight = style['height'] ?? fontSize; //Similar to web.

  TextAttr attr = TextAttr(style);

  TextEditingController baseInputController =  TextEditingController();

  baseInputController.text = value ?? '';

  FocusNode focusNode = FocusNode();

  focusNode.addListener(() {
    if (focusNode.hasFocus) {
      PS.publish('${hid+clone}-focusEventProxy', null);
      PS.publish('${hid+clone}-touchstart', null);
      setTimeout(() {
        PS.publish('${hid+clone}-tap', null);
      }, 17);
    } else {
      PS.publish('${hid+clone}-blurEventProxy', null);

      // Proxy change event.
      if (value != handleInputValue) {
        UPDATE(config, 'value', handleInputValue);

        PS.publish('${hid+clone}-changeEventProxy', handleInputValue);
      }
    }
  });

  Color tcolor = attr.color;

  double fixLineHeight = calcLineHeight(lineHeight, fontSize);

  Widget tree =  TextField(
      controller: baseInputController,
      maxLength: maxlength,
      maxLines: isTextarea ? 3 : 1,
    autocorrect: autocomplete,
    autofocus: autofocus,
    obscureText: usePassword,
    keyboardType: keyboardTypeMap[type],
    onChanged: (text) {
      handleInputValue = text;
      UPDATE(config, 'inputValue', text);
      PS.publish('${hid+clone}-inputEventProxy', text);
    },
    focusNode: focusNode,
    enabled: !disabled,
    style: TextStyle(
      color: tcolor,
      fontFamily: attr.fontFamily,
      fontSize: fontSize,
      height: isTextarea ? calcLineHeight(style['lineHeight'] ?? fontSize, fontSize) : null,
      decoration: attr.textDecoration,
      fontStyle: attr.fontStyle,
      fontWeight: attr.fontWeight,
      letterSpacing: attr.letterSpacing,
      shadows: attr.textShadow
    ),
    textAlign: attr.textAlign,
    decoration: InputDecoration(
      counterText: '',
      hintText: GET(config, 'placeholder'),
      hintStyle: TextStyle(
        color: tcolor.withAlpha((tcolor.alpha * 0.5).round()),
        fontFamily: attr.fontFamily,
        fontSize: fontSize,
        height: isTextarea ? null : fixLineHeight,
        decoration: attr.textDecoration,
        fontStyle: attr.fontStyle,
        fontWeight: attr.fontWeight,
        letterSpacing: attr.letterSpacing,
//        textBaseline: TextBaseline.alphabetic, // work in fluuter 1.x
        shadows: attr.textShadow
      ),
      contentPadding: EdgeInsets.zero,
      border: const OutlineInputBorder(borderSide: BorderSide.none),
      // border: InputBorder.none,
    ),
  );

  return componentWrap(config, tree);
}
