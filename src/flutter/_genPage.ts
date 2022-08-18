import { format, writeIn } from '../common/helper'
import { genetateSets, getPath } from './_helper'
import { IF } from './_env'

function genPageContent(pid) {
  return `import 'package:flutter/material.dart';
import '../common/mixin.dart';
import '../store/index.dart';
import '../common/initView.dart';

class P${pid} extends StatefulWidget {
	P${pid}({required this.title, required this.pid, required this.path }) : super();

	final String title;
	final String pid;
	final String path;

	@override
	_P${pid}State createState() => _P${pid}State(pid, path);
}


class _P${pid}State extends State<P${pid}> {
	final String pid;
	final String path;
	_P${pid}State(this.pid, this.path);
	@override
  void initState() {
    super.initState();

		initStore('${pid}');
    setStatusBar('${pid}');
  }
	@override
	Widget build(BuildContext context) {
		MediaQueryData deviceData = MediaQuery.of(context);

		${
      pid == 'index'
        ? 'if (deviceData.size.width < 10.0) return $padding; //hack for profile and release mode\n'
        : ''
    }
		setUnit(deviceData);

		setContext('${pid}', context);

		return initView('${pid}');
	}
}

`
}

function genPages() {
  IF.ctx.pages.forEach((pid) => {
    genetateSets(pid)

    const content = genPageContent(pid)
    const road = getPath('pages/' + pid + '.dart')

    writeIn(road, format(content, 'dart'))
  })
}

export { genPages }
