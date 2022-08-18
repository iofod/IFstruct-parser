part of '../ui.dart';

Widget baseExterior(Config config, slot) {
  String entry = GET(config, 'entry') ?? '';

  if (entry == '') return componentWrap(config, $padding);

  Map sets = $struct[config.hid];
  Map externals = sets['externals'] ?? {};
  String headerStr = '';

  externals.forEach((K, V) {
    if (V.contains('.css')) {
      headerStr += '<link href="$V" rel="stylesheet"></link>';
    }

    if (V.contains('.js')) {
      headerStr += '<script src="$V"></script>';
    }
  });

  final htmlBase64 = 'data:text/html;base64,' + base64Encode(
    const Utf8Encoder().convert('''
  <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
        <style type="text/css">body,html,#chart{height: 100%;width: 100%;margin: 0px;}div {-webkit-tap-highlight-color:rgba(255,255,255,0);}</style>
        $headerStr
      </head>
      <body>
        <div id="app"></div>
        <script type="module">
          import { setup } from '$entry'

          setup(document.getElementById('app'))
        </script>
      </body>
    </html>
  ''')
  );

  var ua;

  if (Platform.isIOS) {
    ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
  } else if (Platform.isAndroid) {
    ua = 'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Mobile Safari/537.36';
  } else {
    return componentWrap(config, $padding);
  }

  Widget tree = WebView(
    backgroundColor: const Color(0x00000000),
    initialUrl: htmlBase64,
    userAgent: ua,
    javascriptMode: JavascriptMode.unrestricted,
    onWebResourceError: (e) {
      if (kDebugMode) {
        print(e);
      }
    },
  );

  return componentWrap(config, tree);
}
