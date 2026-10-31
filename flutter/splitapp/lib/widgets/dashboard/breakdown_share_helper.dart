import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';

Future<void> copyBreakdownSummaryToClipboard(
  BuildContext context, {
  required Bill bill,
  required CalculationResult preview,
}) async {
  final currency = bill.currency;
  final hasAdjustments = preview.adjustmentsTotal != 0;

  final lines = <String>[];
  lines.add('🧾 *${bill.name.isEmpty ? 'Bill Split' : bill.name}*');
  if (bill.vendor != null && bill.vendor!.isNotEmpty) {
    lines.add('📍 *${bill.vendor}*');
  }
  if (bill.date != null || bill.invoiceNumber != null) {
    final dateStr = bill.date != null ? '📅 ${bill.date} ' : '';
    final invStr = bill.invoiceNumber != null ? '#${bill.invoiceNumber}' : '';
    lines.add('$dateStr$invStr'.trim());
  }
  lines.add(
    'Total: *${formatMoney(preview.billTotal, currency)}* '
    '(Products: ${formatMoney(preview.itemsTotal, currency)}'
    '${hasAdjustments ? ' + Taxes: ${formatMoney(preview.adjustmentsTotal, currency)}' : ''})',
  );
  lines.add('──────────────────────────────');

  for (final person in bill.people) {
    final pRes = preview.people[person.id];
    final share = pRes?.share ?? 0;
    final itemsShare =
        (pRes?.itemContributions.values ?? []).fold<int>(0, (a, b) => a + b);
    final taxShare = bill.adjustments.fold<int>(0, (sum, adj) {
      return sum + (preview.adjustmentAllocations[adj.id]?[person.id] ?? 0);
    });

    var line = '• *${person.name}*: ${formatMoney(share, currency)}';
    if (hasAdjustments) {
      line +=
          ' (Items: ${formatMoney(itemsShare, currency)} + Tax: ${formatMoney(taxShare, currency)})';
    }
    if (person.paidAmount > 0) {
      line += ' [Paid ${formatMoney(person.paidAmount, currency)}]';
    }
    lines.add(line);
  }

  if (preview.settlements.isNotEmpty) {
    lines.add('──────────────────────────────');
    lines.add('*Settlements:*');
    for (final s in preview.settlements) {
      final from = bill.people
          .firstWhere((p) => p.id == s.fromPersonId,
              orElse: () => Person(id: s.fromPersonId, name: 'Someone'))
          .name;
      final to = bill.people
          .firstWhere((p) => p.id == s.toPersonId,
              orElse: () => Person(id: s.toPersonId, name: 'Someone'))
          .name;
      lines.add('👉 $from pays $to ${formatMoney(s.amount, currency)}');
    }
  }

  await Clipboard.setData(ClipboardData(text: lines.join('\n')));

  if (context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Bill breakdown summary copied to clipboard!'),
        backgroundColor: AppColors.electricIris,
        duration: Duration(seconds: 2),
      ),
    );
  }
}
