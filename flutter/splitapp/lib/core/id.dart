import 'package:uuid/uuid.dart';

const _uuid = Uuid();

/// Generate a unique id with a readable prefix (e.g. 'bill-...', 'item-...', 'person-...', 'adj-...')
String newId(String prefix) {
  return '$prefix-${_uuid.v4()}';
}
