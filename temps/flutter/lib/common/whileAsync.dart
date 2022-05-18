
part of 'FA.dart';

class FakeWhile {
  var mark = 'RUNNING';
  FakeWhile();
  exec(condition, callback) async {
    if (condition()) {
      if (mark == 'RETURN') {
        return 'RETURN';
      }
      if (mark == 'CONTINUE') {
        return exec(condition, callback);
      }
      if (mark == 'BREAK') {
        return 'BREAK';
      }
      await callback(command);

      return await exec(condition, callback);
    } else {
      return 'END';
    }
  }
  command(type) {
    mark = type;
  }
}