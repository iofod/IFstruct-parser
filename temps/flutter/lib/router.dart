import 'package:fluro/fluro.dart';
import './pages/index.dart';
import './common/vrouter.dart';

final routes = {
  "index": (context, params) => Pindex(title: 'index', pid: 'index', path: 'index'),
	"/": (context, params) => Pindex(title: 'index', pid: 'index', path: 'index'),
};

final router = FluroRouter();
final $router = Router(router);

createRouter() {
  routes.forEach((path, route) {
    router.define(path, handler: Handler(handlerFunc: route));
  });
}