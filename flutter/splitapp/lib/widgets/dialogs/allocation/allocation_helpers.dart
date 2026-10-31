import '../../../core/calculations.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';

({bool ok, String text}) computeAllocationStatus({
  required SplitMode mode,
  required ProductItem item,
  required Bill bill,
  required List<String> selectedIds,
  required Map<String, String> entries,
}) {
  final lineTotal = lineTotalOf(item);
  if (selectedIds.isEmpty) {
    return (
      ok: false,
      text: 'No one is assigned yet — this product will count as unassigned.'
    );
  }
  switch (mode) {
    case SplitMode.equal:
      final each = lineTotal ~/ selectedIds.length;
      final count = selectedIds.length;
      return (
        ok: true,
        text:
            '${formatMoney(each, bill.currency)} each, split equally between $count ${count == 1 ? 'person' : 'people'} (remainder paise go to the first people).'
      );
    case SplitMode.quantity:
      final sum = selectedIds.fold<int>(
          0, (s, id) => s + (int.tryParse(entries[id] ?? '') ?? 0));
      if (sum == item.quantity) {
        return (
          ok: true,
          text:
              'All ${item.quantity} ${item.quantity == 1 ? 'unit is' : 'units are'} assigned.'
        );
      }
      return (
        ok: false,
        text:
            '$sum of ${item.quantity} units assigned — units consumed must add up to the quantity purchased.'
      );
    case SplitMode.custom:
      final sum = selectedIds.fold<int>(
          0, (s, id) => s + (parseAmount(entries[id] ?? '') ?? 0));
      if (sum == lineTotal) {
        return (
          ok: true,
          text:
              'Amounts add up to the line total (${formatMoney(lineTotal, bill.currency)}) exactly.'
        );
      }
      final diff = (sum - lineTotal).abs();
      final isUnder = sum < lineTotal;
      return (
        ok: false,
        text: isUnder
            ? '${formatMoney(diff, bill.currency)} still unassigned (entered ${formatMoney(sum, bill.currency)} of ${formatMoney(lineTotal, bill.currency)}).'
            : '${formatMoney(diff, bill.currency)} too much (entered ${formatMoney(sum, bill.currency)} of ${formatMoney(lineTotal, bill.currency)}).'
      );
    case SplitMode.percentage:
      final sum = selectedIds.fold<double>(
          0.0, (s, id) => s + (double.tryParse(entries[id] ?? '') ?? 0.0));
      final rounded = (sum * 100).round() / 100.0;
      if ((rounded - 100.0).abs() < 0.001) {
        return (ok: true, text: 'Percentages add up to exactly 100%.');
      }
      return (
        ok: false,
        text:
            'Percentages add up to $rounded% — they must total exactly 100%.'
      );
  }
}
