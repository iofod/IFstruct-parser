import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import './router.dart';
import './common/FN.dart';
import './components/auto/connect.dart';

void main() async {
  await dotenv.load(fileName: ".env");
  createRouter();
  initEvalJS();
  runApp(MyApp());
  if (kDebugMode) {
    if (dotenv.env['UseAutoTestInDev'] == '1') {
      useAuto = true;
      createListener();
    }
  }
  if (dotenv.env['UseAutoTestInProd'] == '1') {
    useAuto = true;
    createListener();
  }
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
