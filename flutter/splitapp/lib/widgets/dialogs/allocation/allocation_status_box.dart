import 'package:flutter/material.dart';
import '../../../core/calculations.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';
import '../../common/app_badge.dart';

class AllocationStatusBox extends StatelessWidget {
  final ({bool ok, String text}) status;
  final bool hasSelected;
  final SplitMode mode;
  final List<String> selectedIds;
  final Bill bill;
  final ItemComputation preview;

  const AllocationStatusBox({
    super.key,
    required this.status,
    required this.hasSelected,
    required this.mode,
    required this.selectedIds,
    required this.bill,
    required this.preview,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: (status.ok && hasSelected)
                ? AppColors.successSubtle
                : AppColors.warningSubtle,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: (status.ok && hasSelected)
                  ? AppColors.success.withValues(alpha: 0.3)
                  : AppColors.warning.withValues(alpha: 0.3),
            ),
          ),
          child: Row(
            children: [
              Icon(
                (status.ok && hasSelected)
                    ? Icons.check_circle_outline_rounded
                    : Icons.warning_amber_rounded,
                size: 16,
                color: (status.ok && hasSelected)
                    ? AppColors.success
                    : AppColors.warning,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  status.text,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: (status.ok && hasSelected)
                        ? AppColors.success
                        : AppColors.warning,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (mode != SplitMode.equal && selectedIds.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: selectedIds.map((id) {
              final person = bill.people.firstWhere(
                (p) => p.id == id,
                orElse: () => Person(id: id, name: id),
              );
              final amt = preview.perPerson[id] ?? 0;
              return AppBadge(
                variant: BadgeVariant.secondary,
                label: '${person.name}: ${formatMoney(amt, bill.currency)}',
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}
