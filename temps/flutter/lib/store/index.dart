import 'package:fluttertoast/fluttertoast.dart';
import '../common/FN.dart';
import '../common/observer.dart';
import '../common/mixin.dart';
import '../components/ui.dart';
import '../components/renderTree.dart';
import '../common/style.dart' show tfColor;

import './tree.dart';
var $struct = projectTree;
var $models = projectModel;

final $sets = {};
final $temp = {};

final $store = {
  'sets': $sets,
  'temp': $temp
};

final $hero = observe('hero', heroCP);

final $style = {};
final $prect = {}; // record hid+clone rect
final $rebuild = observe('rebuild', {}); // rebuild proxy
final $position = {}; // record hid+clone 的静态化style.position [hid+clone]: style.position
final $parents = {}; // record hid+clone 的parent hid+clone  [hid+clone]: parent[hid+clone]

final $toast = FToast();

final $bg = tfColor(projectConfig['bgc']);
final $gft = projectConfig['gft'] ?? null;

var $context;
var $contextList = [];

var $currentContextPage = 'index';

bool routerFlying = false;

var $cache = {}; // Cache already computed components to avoid rebuild.

Map $scrollBody = {};
Map $levelChild = {}; // record level map

final $rescroll = observe('rescroll', {});

// 第一步，让树支持深度响应式驱动
void initStore(hid) {
  if ($sets.containsKey(hid)) return;

  var target = $struct[hid];
  var children = target['children'];
  var status = target['status'];
  var ctype = target['content'];
  var type = target['type'];

  $temp[hid] = baseComponent[ctype];

  if (type == 'level') {
    setScrollBody(hid, target['children']);
  }

  var $status = [];
  
  status.forEach((statu) {
    var id = statu.containsKey('id') ? statu['id'].toString() : 'default';
    var props = statu['props'];
    var custom = props['option'];
    var $custom = custom.containsKey('customKeys') ? custom['customKeys'] : {};
    var style = props['style'];

    style['x'] = props['x'];
    style['y'] = props['y'];

    if (custom['ghost'] == true) {
      style['ghost'] = true;
    } else {
      style['ghost'] = false;
    }

    style['d'] = props['d'];
    style['s'] = props.containsKey('s') ? props['s'] : 100.0;

    style['V'] = custom['V'];

    if (style['transition'] != null) {
      var tarr = parseTransition(style['transition']);

      style['during'] = tarr[0] * 1000.0; //s to ms
      style['curve'] = tarr[1];
    } else {
      style['during'] = 0.0;
    }

    var prefix = hid + '_' + id;

    $status.add(observe('${prefix}_statu', {
      'id': id,
      'name': statu['name'],
      'active': statu['active'],
      'custom': observe('${prefix}_custom', $custom),
      'style': observe('${prefix}_style', style)
    }));
  });

  var $model = {};

  target['model'].forEach((K, V) {
    $model[K] = observe('${hid}_model_$K', {
      'value': V['value'],
      'use': V['subscribe']
    });
  });

  $sets[hid] = observe('${hid}_atom', {
    'children': children,
    'status': observe('${hid}_status', $status),
    'model': observe('${hid}_model', $model),
  });


  if (children.length > 0) {
    children.forEach((id) {
      initStore(id);
    });
  }
}

bool isGlobalInited = false;

void setContext(pid, context) {
  print('------------setContext------');

  $context = context;
  $contextList.add(context);

  $currentContextPage = pid;

  if (!isGlobalInited) {
    isGlobalInited = true;

    initStore('Global');

    $toast.init(context);

    Level.setOverlay(context, ComponentTree(hid: 'Global', clone: ''));
  }
}

void setScrollBody(lid, list) {
  list.forEach((id) {
    $levelChild[id] = lid;
  });

  if ($scrollBody[lid] == null) {
    $scrollBody[lid] = { 's': {}, 'r': {} };
  }
}
