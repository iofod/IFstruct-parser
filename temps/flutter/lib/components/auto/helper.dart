import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../common/FN.dart';

List dealFlowSteps(ctx, String id, List list) {
  List nodes = ctx['nodes'];
  List edges = ctx['edges'];

  var node = nodes.where((o) => o['id'] == id).first;

  if (node == null) return list;

  if (node['type'] == 'End') return list;
  if (node['type'] == 'If') {
    var oedge = edges.where((e) => (e['properties'])['source'] == 'O' && e['sourceNodeId'] == id).first;
    var xedge = edges.where((e) => (e['properties'])['source'] == 'X' && e['sourceNodeId'] == id).first;

    list.add({
      'id': id,
      'assert': (node['properties'])['value'],
      'O': oedge != null ? dealFlowSteps(ctx, oedge['targetNodeId'], []) : [],
      'X': xedge != null ? dealFlowSteps(ctx, xedge['targetNodeId'], []) : [],
    });

    return list;
  } else {
    list.add({
      'id': id,
      'value': (node['properties'])['value'],
    });

    var nextEdge = edges.where((e) => e['sourceNodeId'] == id).first;

    if (nextEdge == null) return list;

    return dealFlowSteps(ctx, nextEdge['targetNodeId'], list);
  }
}

List dealFlow(ctx) {
  List nodes = ctx['nodes'];
  List edges = ctx['edges'];

  var item = nodes.where((o) => o['type'] == 'Start').first;

  if (item == null) return [];

  var sedge = edges.where((e) => e['sourceNodeId'] == '1').first;

  if (sedge == null) return [];

  return dealFlowSteps(ctx, sedge['targetNodeId'], []);
}

List dealCaseSteps(List sub) {
  List list = [];

  int L = sub.length;
  int I = 0;

  for (; I < L; I++) {
    var obj = sub[I];
    var next = (I + 1 == L) ? null : sub[I + 1];

    if (next != null) {
      if (next['_'] - next['_pt'] < obj['_']) {
        List left = [next];
        List right = [];

        sub.sublist(I + 2).forEach((o) {
          if (o['_'] - o['_pt'] > obj['_']) {
            right.add(o);
          } else {
            left.add(o);
          }
        });

        List concurrency = [obj];
        concurrency.addAll(dealCaseSteps(right));

        list.add(concurrency);
        list.addAll(dealCaseSteps(left));

        return list;
      } else {
        list.add(obj);
      }
    } else {
      list.add(obj);
    }
  }

  return list;
}

Future proxyEvent(String pn) {
  final com = Completer();
  final future = com.future;

  if ((kDebugMode && dotenv.env['UseAutoTestInDev'] == '1') || dotenv.env['UseAutoTestInProd'] == '1') {
    PS.subscribeOnce(pn, (_) {
      com.complete();
    });
  }
  
  return future;
}