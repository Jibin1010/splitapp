import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';
import '../common/person_avatar.dart';

class SplitPersonSummaryTile extends StatelessWidget {
  final Bill bill;
  final CalculationResult result;
  final Person person;

  const SplitPersonSummaryTile({
    super.key,
    required this.bill,
    required this.result,
    required this.person,
  });

  @override
  Widget build(BuildContext context) {
    final personResult = result.people[person.id];
    if (personResult == null) return const SizedBox.shrink();

    final contribs = personResult.itemContributions.entries.toList();
    final isPositive = personResult.net > 0;
    final isNegative = personResult.net < 0;

    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        childrenPadding: const EdgeInsets.only(left: 36, bottom: 8, right: 8),
        leading: PersonAvatar(
          name: person.name,
          photo: person.photo,
          size: AvatarSize.sm,
        ),
        title: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    person.name,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    'Paid ${formatMoney(personResult.paid, bill.currency)}${contribs.isNotEmpty ? ' · ${contribs.length} ${contribs.length == 1 ? 'item' : 'items'}' : ''}',
                    style:
                        const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  formatMoney(personResult.share, bill.currency),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'monospace',
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  isPositive
                      ? 'gets back ${formatMoney(personResult.net, bill.currency)}'
                      : isNegative
                          ? 'owes ${formatMoney(-personResult.net, bill.currency)}'
                          : 'settled',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    fontFamily: 'monospace',
                    color: isPositive
                        ? AppColors.success
                        : isNegative
                            ? AppColors.danger
                            : AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ],
        ),
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (contribs.isEmpty && result.adjustmentsTotal == 0)
                  const Text(
                    'No items assigned.',
                    style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                  )
                else ...[
                  for (final entry in contribs) ...[
                    Builder(builder: (ctx) {
                      final item = bill.items.firstWhere(
                        (i) => i.id == entry.key,
                        orElse: () => ProductItem(
                          id: entry.key,
                          name: 'Removed product',
                          quantity: 1,
                          unitPrice: 0,
                          allocation: Allocation.equal(const []),
                        ),
                      );
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                item.name.isEmpty
                                    ? 'Untitled product'
                                    : item.name,
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textSecondary),
                              ),
                            ),
                            Text(
                              formatMoney(entry.value, bill.currency),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'monospace',
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                  for (final adj in bill.adjustments) ...[
                    Builder(builder: (ctx) {
                      final amt =
                          result.adjustmentAllocations[adj.id]?[person.id] ?? 0;
                      if (amt == 0) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                adj.label.isEmpty ? adj.kind.label : adj.label,
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textSecondary),
                              ),
                            ),
                            Text(
                              formatMoney(amt, bill.currency),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'monospace',
                                color: amt < 0
                                    ? AppColors.success
                                    : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
