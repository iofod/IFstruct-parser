import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_mobx/flutter_mobx.dart';
import 'dart:math' as math;
import 'package:myapp/common/FN.dart';
import '../store/index.dart';
import 'ui.dart';
import '../common/mixin.dart';
import './type.dart';

class ComponentTree extends StatefulWidget {
  final String hid;
  final String clone;
  ComponentTree({required this.hid, required this.clone});
  @override
  _ComponentTreeState createState() => _ComponentTreeState();
}

class _ComponentTreeState extends State<ComponentTree> {
  _ComponentTreeState();
  bool builded = false;

  ScrollController controller = ScrollController();

  levelSlot(slot) {
    return slot;
  }

  getMirror(item) {
    var hid = widget.hid;
    var clone = widget.clone;
    var use = GET_(hid, clone, 'use');

    if (use is String && use != '') {
      bool isParentHasCn = clone.contains('|');

      if (use is List && isParentHasCn) {
        List paths = widget.clone
            .split('|')
            .where((v) => v != '')
            .map((v) => int.parse(v))
            .toList();
        int index = paths[paths.length - 1];
        var value = finder(paths, use) ?? '';
        var cn = value is List ? value[index] : value;

        return cn;
      } else {
        return use;
      }
    } else {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    var hid = widget.hid;
    var clone = widget.clone;
    var item = $struct[hid];
    var $item = $sets[hid].value;
    var isLevel = item['type'] == 'level';
    var isContainer = item['type'] == 'container';
    var isMirror = item['content'] == 'base/mirror';
    var list = isMirror ? [getMirror($item)] : $item['children'];

    return Observer(builder: (_) {
      if (!canRender(hid)) {
        builded = false;
        return $padding;
      }

      var style = calcStyle(hid, clone);

      if (style['display'] == 'none') return $padding;

      var model = $item['model'];
      var position = style['position'];

      if ($position[hid + clone] != position) {
        var pid = $parents[hid + clone];

        $calcCache[hid + clone] = null;

        $rebuild.value[pid] = GV.T();

        if (kDebugMode) {
          print('rebuild: $pid');
        }
      }

      // ignore: unused_local_variable
      var buildId = $rebuild.value[hid + clone];

      List<Widget> flexChildren = [];
      List<Widget> stackChildren = [];

      Map rect = {
        'pw': style['width'],
        'ph': style['height'],
        'pdx': style['pdx'] ?? 0.0,
        'pdy': style['pdy'] ?? 0.0,
        'bdx': style['bdx'] ?? 0.0,
        'bdy': style['bdy'] ?? 0.0,
      };

      if (isContainer &&
          style['overflowX'] != null &&
          style['overflowX'] != null &&
          $scrollBody[hid] == null) {
        setScrollBody(hid, $struct[hid]['children']);
      }

      list.forEach((id) {
        var cv = getCloneNum(id, clone);

        if (cv == 0) return;

        generateArray(cv).asMap().keys.map((I) {
          var scv = isLevel
              ? cv > 1
              ? '|' + I.toString()
              : ''
              : getSubClone(id, I, clone);

          $parents[id + scv] = hid + clone;

          $prect[id + scv] = rect;

          var layout = getPosition(id, scv);

          var sub;

          if ($cache[id + scv] != null) {
            sub = $cache[id + scv];
          } else {
            sub = ComponentTree(hid: id, clone: scv);

            $cache[id + scv] = sub;
          }

          if (layout == 'static') {
            flexChildren.add(sub);
          } else {
            stackChildren.add(sub);
          }
        }).toList();
      });

      var lid = $levelChild[hid];

      if (lid != null && lid != 'Global' && style['position'] != 'static') {
        double hw = style['rectWidth'] / 2.0;
        double hh = style['rectHeight'] / 2.0;
        //https://indienova.com/u/feonya/blogread/21018
        // x’ = x cosβ – y sin β
        // y’ = x sinβ + y cos β
        // z’ = z
        double xd = 0.0;
        double yd = 0.0;
        double r = style['rotate'].toDouble();

        double s = (style['s'] ?? 100.0) / 100;
        double rx = 0.0;
        double ry = 0.0;

        if (r != 0) {
          double deg = (r % 360.0 + 360.0) % 180.0; // Positive and negative do not affect, so find the factor first.
          double pr = math.pi / 180 * deg;

          if (deg < 90.0) {
            yd = hw * math.sin(pr) + hh * math.cos(pr);
            xd = hw * math.cos(pr) + hh * math.sin(pr);
          } else {
            yd = hw * math.sin(pr) - hh * math.cos(pr);
            xd = -hw * math.cos(pr) + hh * math.sin(pr);
          }

          rx = hw + xd * s;
          ry = hh + yd * s;
        } else {
          rx = hw + hw * s;
          ry = hh + hh * s;
        }

        double mv = style['x'] + style['marginSize'][0] + rx;
        double nv = style['y'] + style['marginSize'][1] + ry;

        $scrollBody[lid]['r'][hid] = mv;
        $scrollBody[lid]['s'][hid] = nv;

        PS.publish('change_scroll_$lid');
      }

      Config config = Config(
          hid: setItem(hid),
          clone: clone,
          item: $item,
          type: item['type'],
          style: style,
          model: model,
          context: context,
          controller: controller
        );
      List slot = [flexChildren, stackChildren];

      if (isLevel || isContainer) {
        if (!builded) {
          builded = true;

          PS.publish('${hid + clone}-readyEvent', GV.T());
        }
      }

      return transition(baseComponent[item['content']](config, slot));
    });
  }
}
