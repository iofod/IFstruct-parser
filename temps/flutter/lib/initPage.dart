import 'package:flutter/material.dart';

bool isJumpBuilded = true;

class PinitPage extends StatefulWidget {
	PinitPage({required this.title, this.root }) : super();

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

