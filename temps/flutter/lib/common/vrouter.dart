import 'package:flutter/material.dart';
import 'package:fluro/fluro.dart';
import './FN.dart';
import '../store/index.dart';

calcQuery(params) {
  String query =  "";

  if (params != null) {
    int index = 0;
    for (var key in params.keys) {
      var value = Uri.encodeComponent(params[key]);
      if (index == 0) {
        query = "?";
      } else {
        query = "$query&";
      }
      query += "$key=$value";
      index++;
    }
  }

  return query;
}

// https://www.jianshu.com/p/e575787d173c
class Router {
  final router;
  Router(this.router);
  // Encode the parameters to resolve special characters in the parameters that affect fluro route matching.
  // TransitionType.native
  Future navigateTo(String path, { replace = false, required Map<String, dynamic> params, required String type, during }) {
    TransitionType transition = type == 'fade' ? TransitionType.fadeIn : TransitionType.inFromRight;

    PS.subscribeOnce(path, (context) {
      $context = context;
      $contextList.add(context);

      $currentContextPage = path;
    });

    return router.navigateTo($context, path + calcQuery(params), replace: replace, transition: transition, transitionDuration: during);
  }
  Future navigateBack(int delta, bool jump) async {
    if (delta > $contextList.length) {
      delta = $contextList.length;
    }
    for (var i = 0; i < delta; i++) {
      // WillPopScope don't need to Navigator.pop()
      if (jump) {
        Navigator.pop($context);
      }

      $contextList.removeAt($contextList.length - 1);

      $context = $contextList[$contextList.length - 1];

      $currentContextPage = $context.state.pid;
    }

    return true;
  }
}