import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';
import '../common/person_avatar.dart';

class BreakdownTableView extends StatelessWidget {
  final Bill bill;
  final CalculationResult preview;
  final Person? activePerson;
  final ValueChanged<Person>? onSelectPerson;

  const BreakdownTableView({
    super.key,
    required this.bill,
    required this.preview,
    this.activePerson,
    this.onSelectPerson,
  });

  @override
  Widget build(BuildContext context) {
    final currency = bill.currency;
    final hasAdjustments = preview.adjustmentsTotal != 0;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(AppColors.surface),
          columnSpacing: 20,
          horizontalMargin: 16,
          headingTextStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: AppColors.textMuted,
            letterSpacing: 0.5,
          ),
          dataTextStyle: const TextStyle(
            fontSize: 12,
            color: Colors.white,
          ),
          columns: [
            const DataColumn(label: Text('PARTICIPANT')),
            const DataColumn(label: Text('ITEMS SHARED')),
            const DataColumn(label: Text('FOOD SPEND'), numeric: true),
            if (hasAdjustments) const DataColumn(label: Text('GST SHARE'), numeric: true),
            const DataColumn(label: Text('TOTAL SHARE'), numeric: true),
            const DataColumn(label: Text('PAID'), numeric: true),
            const DataColumn(label: Text('NET BALANCE')),
          ],
          rows: bill.people.map((person) {
            final pRes = preview.people[person.id];
            final totalShare = pRes?.share ?? 0;
            final itemsShare = (pRes?.itemContributions.values ?? []).fold<int>(0, (a, b) => a + b);
            final gstShare = bill.adjustments.fold<int>(0, (sum, adj) {
              return sum + (preview.adjustmentAllocations[adj.id]?[person.id] ?? 0);
            });
            final paid = person.paidAmount;
            final net = pRes?.net ?? (paid - totalShare);
            final isActive = activePerson?.id == person.id;

            final sharedNames = (pRes?.itemContributions.keys ?? [])
                .map((id) => bill.items.firstWhere((i) => i.id == id, orElse: () => ProductItem(id: id, name: 'Item', quantity: 1, unitPrice: 0, allocation: Allocation.equal([]))).name)
                .join(', ');

            return DataRow(
              color: isActive ? WidgetStateProperty.all(AppColors.surface.withValues(alpha: 0.5)) : null,
              onSelectChanged: onSelectPerson != null ? (_) => onSelectPerson!(person) : null,
              cells: [
                DataCell(
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      PersonAvatar(name: person.name, photo: person.photo, size: AvatarSize.xs),
                      const SizedBox(width: 8),
                      Text(person.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      if (isActive) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: AppColors.electricIris,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('YOU', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white)),
                        ),
                      ],
                    ],
                  ),
                ),
                DataCell(
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 160),
                    child: Text(
                      sharedNames.isEmpty ? 'None' : sharedNames,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                    ),
                  ),
                ),
                DataCell(Text(formatMoney(itemsShare, currency), style: const TextStyle(fontFamily: 'monospace'))),
                if (hasAdjustments)
                  DataCell(Text('+${formatMoney(gstShare, currency)}', style: const TextStyle(color: AppColors.honeyAmber, fontFamily: 'monospace'))),
                DataCell(Text(formatMoney(totalShare, currency), style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'))),
                DataCell(Text(formatMoney(paid, currency), style: const TextStyle(color: AppColors.textSecondary, fontFamily: 'monospace'))),
                DataCell(
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: net > 0
                          ? AppColors.mintSage.withValues(alpha: 0.15)
                          : net < 0
                              ? AppColors.coralRed.withValues(alpha: 0.15)
                              : AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: net > 0
                            ? AppColors.mintSage.withValues(alpha: 0.4)
                            : net < 0
                                ? AppColors.coralRed.withValues(alpha: 0.4)
                                : AppColors.border,
                      ),
                    ),
                    child: Text(
                      net > 0
                          ? 'Gets back ${formatMoney(net, currency)}'
                          : net < 0
                              ? 'Owes ${formatMoney(-net, currency)}'
                              : 'Settled ✓',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: net > 0
                            ? AppColors.mintSage
                            : net < 0
                                ? AppColors.coralRed
                                : AppColors.textMuted,
                      ),
                    ),
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}
