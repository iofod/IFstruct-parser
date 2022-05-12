import 'package:flutter/material.dart';
import '../common/mixin.dart';
import '../store/index.dart';
import '../common/initView.dart';

class Pindex extends StatefulWidget {
	Pindex({required this.title, required this.pid, required this.path }) : super();

	final String title;
	final String pid;
	final String path;

	@override
	_PindexState createState() => _PindexState(pid, path);
}


class _PindexState extends State<Pindex> {
	final String pid;
	final String path;
	_PindexState(this.pid, this.path);
	@override
  void initState() {
    super.initState();
    
		initStore('index');
    setStatusBar('index');
  }
	@override
	Widget build(BuildContext context) {
		var deviceData = MediaQuery.of(context);

		setUnit(deviceData);

		setContext('index', context);

		return initView('index');
	}
}

