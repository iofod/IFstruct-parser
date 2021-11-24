import 'package:fluro/fluro.dart';

import './common/vrouter.dart';
import './initPage.dart';

final routes = {
};

final router = FluroRouter();
final $router = Router(router);

createRouter() {
  routes.forEach((path, route) {
    router.define(path, handler: Handler(handlerFunc: route));
  });
}