part of '../ui.dart';

Map iframeCache = {};

Widget baseIframe(Config config, slot) {
  var url = GET(config, 'src') ?? '';

  if (isWeb) {
    return componentWrap(config, const Text('webview'));
  }

  var ua;

  if (Platform.isIOS) {
    ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
  } else if (Platform.isAndroid) {
    ua = 'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Mobile Safari/537.36';
  } else {
    return componentWrap(config, $padding);
  }

  var hid = config.hid;
  var clone = config.clone;

  if (iframeCache[hid + clone] != null) {
    WebViewController controller = iframeCache[hid + clone];

    controller.loadUrl(url);
  }
  
  Widget tree = WebView(
    initialUrl: url,
    onWebViewCreated: (WebViewController webViewController) {
      iframeCache[hid + clone] = webViewController;
      PS.subscribeOnce('routechange', (_) {
        iframeCache[hid + clone] = null;
      });
    },
    userAgent: ua,
  );

  return componentWrap(config, tree);
}
