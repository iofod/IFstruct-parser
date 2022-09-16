import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/io.dart';

import '../../common/FN.dart';
import './index.dart';

var channel;

runCasesCallback(res) {
  if (channel != null) {
    channel.sink.add(jsonEncode({
      'type': 'CALLBACK',
      'payload': res
    }));
  }
}

createListener() {
  channel = IOWebSocketChannel.connect(Uri.parse(dotenv.env['AutoWebsocketUrl'] ?? ''));
  channel.stream.listen(
    (res) {
      Map data = jsonDecode(res);
      String type = data['type'];
      Map payload = data['payload'];

      if (type == 'START_AUTO') {
        setCTX(payload);

        setTimeout(() {
          if (kDebugMode) {
            print('--- Run Cases ---');
          }
          runCases(payload['item']);
        }, 500);
      }
    },
    onError: (error) {
      if (kDebugMode) {
        print("IOWebSocketChannel error");
        print(error);
      }

      channel = null;
    },
    onDone: () {
      if (kDebugMode) {
        print("IOWebSocketChannel close");
      }

      channel = null;
    },
    cancelOnError: true
  );
}