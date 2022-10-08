part of '../ui.dart';

Widget baseExterior(Config config, slot) {
  String entry = GET(config, 'entry') ?? '';

  // Support Native only
  if (entry == '' || isWeb) return componentWrap(config, $padding);

  Map sets = $struct[config.hid];
  Map externals = sets['externals'] ?? {};
  String headerStr = '';
  bool isUT = entry.startsWith('@UT/');
  String hid = config.hid;
  String clone = config.clone ?? '';

  String ua;

  if (Platform.isIOS) {
    ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
  } else if (Platform.isAndroid) {
    ua = 'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Mobile Safari/537.36';
  } else {
    return componentWrap(config, $padding);
  }

  headerStr += '<script>$bridgeSDK';
  headerStr += '''
SDK.AJAX = function(url, options = {}) {
  return bridgeExec('CC:', JSON.stringify({
    method: 'AJAX',
    payload: { url, options }
  }))
}

function bridgeExec(type, payload) {
  let token = uuid()

  return new Promise(done => {
    window.PS.subscribeOnce(type + token, (msg, data) => {
      done(data)
    })

    WebViewBridge.postMessage(type + token + ':' + payload)
  })
}

window.bridgeExec = bridgeExec
</script>
''';

  externals.forEach((K, V) {
    if (V.contains('.css')) {
      headerStr += '<link href="$V" rel="stylesheet"></link>';
    }

    if (V.contains('.js')) {
      headerStr += '<script src="$V"></script>';
    }
  });

  if (isUT) {
    headerStr += '<script>$utilFnsString</script>';
  }

  String importStr = isUT
    ? ('const { setup } = window.' + entry.substring(1).split('/').join('.') + '(document.getElementById("app"))')
    : 'import { setup } from "$entry"';

  final htmlBase64 = 'data:text/html;base64,' + base64Encode(
    const Utf8Encoder().convert('''
  <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
        <style type="text/css">body,html,#app{position: absolute;height: 100%;width: 100%;margin: 0px;}div {-webkit-tap-highlight-color:rgba(255,255,255,0);}</style>
        $headerStr
      </head>
      <body>
        <div id="app" hid="$hid" clone="$clone"></div>
        <script type="module">
          $importStr
          setup(document.getElementById('app'))
        </script>
      </body>
    </html>
  ''')
  );

  WebViewController? controller;

  Widget tree = WebView(
    backgroundColor: const Color(0x00000000),
    initialUrl: htmlBase64,
    userAgent: ua,
    javascriptMode: JavascriptMode.unrestricted,
    onWebViewCreated: (WebViewController webViewController) {
      controller = webViewController;
    },
    javascriptChannels: <JavascriptChannel>{
      JavascriptChannel(
          name: 'WebViewBridge',
          onMessageReceived: (JavascriptMessage javascriptMessage) {
            String str = javascriptMessage.message;
            String topic = str.substring(0, 3);
            String token = str.substring(3, 39);
            String payload = str.substring(40);

            var res;

            if (topic == 'CC:') {
              res = SDK.call(payload);
            }

            if (topic == 'JS:') {
              res = SDK.emit(payload);
            }

            controller?.runJavascript('''
            window.PS.publishSync('$topic$token', ${Executable(res)})
            ''');
          }),
    },
    onWebResourceError: (e) {
      if (kDebugMode) {
        print(e);
      }
    },
  );

  return componentWrap(config, tree);
}
