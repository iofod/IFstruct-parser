import 'package:flutter/material.dart';
import './common/mixin.dart';

bool isJumpBuilded = true;

class PinitPage extends StatefulWidget {
	PinitPage({Key key, this.title, this.root }) : super(key: key);

	final String title;
	final root;

	@override
	_PinitPageState createState() => _PinitPageState(root);
}

class _PinitPageState extends State<PinitPage> {
	final root;
	_PinitPageState(this.root);
	@override
	Widget build(BuildContext context) {
    // if (isJumpBuilded) {
    //   isJumpBuilded = false;
    //   return $padding;
    // }
    return root;
	}
}

