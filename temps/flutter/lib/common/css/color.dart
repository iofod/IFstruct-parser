part of '../style.dart';

Color tfColor(String hash) {
  if (hash.startsWith('rgba')) {
    List ca = hash.substring(5, hash.length - 1).replaceAll(' ', '').split(',');

    return Color.fromRGBO(int.parse(ca[0]), int.parse(ca[1]), int.parse(ca[2]),
        double.parse(ca[3]));
  } else if (hash.startsWith('rgb')) {
    List ca = hash
        .substring(4, hash.length - 1)
        .split(',')
        .map((e) => int.parse(e))
        .toList();

    return Color.fromARGB(255, ca[0], ca[1], ca[2]);
  } else if (hash.startsWith('#')) {
    return Color(int.parse(hash.substring(1), radix: 16)).withAlpha(255);
  } else {
    return const Color(0x00000000);
  }
}
