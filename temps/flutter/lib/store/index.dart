import 'package:fluttertoast/fluttertoast.dart';
import '../common/FN.dart';
import '../common/observer.dart';
import '../components/ui.dart';
import '../common/style.dart' show tfColor;
import '../common/initView.dart';

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
final $xy = {};
final $rebuild = observe('rebuild', {}); // rebuild proxy
final $position = {}; // record hid+clone style.position [hid+clone]: style.position
final $parents = {}; // record hid+clone hid+clone  [hid+clone]: parent[hid+clone]
final $safePosition = {}; // cache level children when useSafeArea

final $toast = FToast();

final $bg = tfColor(projectConfig['bgc']);
final $gft = projectConfig['gft'];

var $context;
var $contextList = [];

var $currentContextPage = '';

bool routerFlying = false;

var $cache = {}; // Cache already computed components to avoid rebuild.

Map $scrollBody = {};
Map $levelChild = {}; // record level map

final $rescroll = observe('rescroll', {});

void initStore(hid) {
  if ($sets.containsKey(hid)) return;

  var target = $struct[hid];
  var children = target['children'];
  var status = target['status'];
  var ctype = target['content'];
  var type = target['type'];
  var parent = target['parent'];

  bool isPage = type == 'page';
  bool isLevel = type == 'level';

  $temp[hid] = baseComponent[ctype];

  if (isLevel) {
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
    style['tx'] = props['tx'];
    style['ty'] = props['ty'];

    if (custom['ghost'] == true) {
      style['ghost'] = true;
    } else {
      style['ghost'] = false;
    }

    if (isPage) {
      style['hideStatusBar'] = custom['hideStatusBar'] ?? false;
      style['statusBarTheme'] = custom['statusBarTheme'] ?? 'light';
    }

    if (isLevel) {
      target['useSafeArea'] = style['useSafeArea'] = custom['useSafeArea'] ?? true; // cache useSafeArea
    }

    style['d'] = props['d'];
    style['s'] = props['s'];
    style['V'] = custom['V'];

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
    'parent': parent,
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
  if ($currentContextPage == pid) return;

  PS.publishSync(pid, context);

  if (!isGlobalInited) {
    $context = context;
    $contextList.add(context);
    $currentContextPage = pid;

    isGlobalInited = true;

    initStore('Global');

    $toast.init(context);

    Level.setOverlay(context, calcGlobalLevel());

    if (useAuto) {
      Level.setOverlay(context, previewCursor());
    }
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
