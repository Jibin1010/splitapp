import '../models/split_types.dart';
import 'calculations.dart';
import 'money.dart';

String _csvCell(String value) {
  if (value.contains('"') || value.contains(',') || value.contains('\r') || value.contains('\n')) {
    return '"${value.replaceAll('"', '""')}"';
  }
  return value;
}

String _csvRow(List<dynamic> cells) {
  return cells.map((c) => _csvCell(c.toString())).join(',');
}

/// Build a human-readable CSV summary of a calculated bill:
/// bill overview, products, per-person results and settlement transfers.
/// RFC 4180 compliant.
String buildCsv(Bill bill, CalculationResult result) {
  String fmt(int p) => formatMoney(p, bill.currency);
  final rows = <String>[];

  rows.add(_csvRow(['SplitLedger bill summary']));
  rows.add(_csvRow(['Bill name', bill.name.isNotEmpty ? bill.name : 'Shared Bill']));
  rows.add(_csvRow(['Currency', bill.currency.code]));
  rows.add(_csvRow(['Items total', fmt(result.itemsTotal)]));
  rows.add(_csvRow(['Adjustments total', fmt(result.adjustmentsTotal)]));
  rows.add(_csvRow(['Bill total', fmt(result.billTotal)]));
  rows.add(_csvRow(['Generated at', DateTime.now().toIso8601String()]));
  rows.add('');

  rows.add(_csvRow(['Products']));
  rows.add(_csvRow(['Product', 'Quantity', 'Unit price', 'Line total', 'Split mode', 'Assigned to']));
  for (final item in bill.items) {
    final people = bill.people.where((p) => (result.itemAllocations[item.id]?[p.id] ?? 0) > 0);
    rows.add(
      _csvRow([
        item.name.isNotEmpty ? item.name : 'Untitled product',
        item.quantity,
        fmt(item.unitPrice),
        fmt(lineTotalOf(item)),
        item.allocation.mode.label,
        people.map((p) => p.name).join('; '),
      ]),
    );
  }
  rows.add('');

  rows.add(_csvRow(['People']));
  rows.add(_csvRow(['Name', 'Total share', 'Paid', 'Net balance']));
  for (final person in bill.people) {
    final r = result.people[person.id];
    if (r == null) continue;
    rows.add(_csvRow([person.name, fmt(r.share), fmt(r.paid), fmt(r.net)]));
  }
  rows.add('');

  rows.add(_csvRow(['Settlement instructions']));
  rows.add(_csvRow(['From', 'To', 'Amount']));
  for (final s in result.settlements) {
    final fromName = bill.people.firstWhere((p) => p.id == s.fromPersonId, orElse: () => Person(id: s.fromPersonId, name: s.fromPersonId)).name;
    final toName = bill.people.firstWhere((p) => p.id == s.toPersonId, orElse: () => Person(id: s.toPersonId, name: s.toPersonId)).name;
    rows.add(_csvRow([fromName, toName, fmt(s.amount)]));
  }

  return rows.join('\r\n');
}
