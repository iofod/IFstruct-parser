import 'package:flutter/material.dart';
import 'package:myapp/store/index.dart';
import './router.dart';
import './common/FN.dart';

void main() {
  createRouter();
  initEvalJS();
  runApp(MyApp());
}

var event;

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // https://api.flutter.dev/flutter/dart-ui/Offset-class.html
    return Listener(
      child: MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      onGenerateRoute: router.generator,
    ),
      onPointerDown: (PointerDownEvent e) { MOUSE.start(e); },
      onPointerMove: (PointerMoveEvent e) { MOUSE.move(e); },
      onPointerUp: (PointerUpEvent e) { MOUSE.end(e); },
    );
  }
}