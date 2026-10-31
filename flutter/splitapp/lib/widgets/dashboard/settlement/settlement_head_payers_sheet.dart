import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../state/bill_state.dart';
import '../../../theme/app_theme.dart';
import '../../common/person_avatar.dart';

/// Head Payers Setup Bottom Sheet for Multi-Payer Reconciliation
class HeadPayersSetupSheet extends StatefulWidget {
  final BillState state;

  const HeadPayersSetupSheet({super.key, required this.state});

  @override
  State<HeadPayersSetupSheet> createState() => _HeadPayersSetupSheetState();
}

class _HeadPayersSetupSheetState extends State<HeadPayersSetupSheet> {
  @override
  Widget build(BuildContext context) {
    final bill = widget.state.bill;
    final preview = widget.state.preview;
    final currency = bill.currency;
    final totalPaid = bill.people.fold<int>(0, (sum, p) => sum + p.paidAmount);
    final billTotal = preview.billTotal;
    final diff = billTotal - totalPaid;
    final isBalanced = totalPaid == billTotal && billTotal > 0;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.tune_rounded, color: AppColors.honeyYellow, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'HEAD PAYERS RECONCILIATION',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary),
              ),
            ],
          ),

          const SizedBox(height: 8),
          const Text(
            'Specify who paid for the bill upfront. Settlements will be automatically routed to them.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),

          const SizedBox(height: 16),

          // Balance Indicator Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isBalanced
                  ? AppColors.mintSage.withValues(alpha: 0.15)
                  : AppColors.coral.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isBalanced ? AppColors.mintSage : AppColors.coral,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isBalanced
                      ? '✓ Fully Balanced: ${formatMoney(totalPaid, currency)}'
                      : 'Difference: ${formatMoney(diff.abs(), currency)} ${diff > 0 ? 'underpaid' : 'overpaid'}',
                  style: TextStyle(
                    color: isBalanced ? AppColors.mintSage : AppColors.coral,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  'Bill: ${formatMoney(billTotal, currency)}',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Quick Preset Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    widget.state.splitEqualPaid();
                    setState(() {});
                  },
                  icon: const Icon(Icons.pie_chart_rounded, size: 14),
                  label: const Text('Split Equal Paid', style: TextStyle(fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.surfaceElevated,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    widget.state.autoBalanceToFirstPerson();
                    setState(() {});
                  },
                  icon: const Icon(Icons.auto_fix_high_rounded, size: 14),
                  label: const Text('Auto-Balance', style: TextStyle(fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.electricIris,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Per-Person Paid Amount Input List
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 280),
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: bill.people.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final person = bill.people[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      PersonAvatar(name: person.name, photo: person.photo, size: AvatarSize.sm),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          person.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      // Paid Full Bill shortcut
                      TextButton(
                        onPressed: () {
                          widget.state.setSingleHeadPayer(person.id);
                          setState(() {});
                        },
                        child: const Text('Paid All', style: TextStyle(fontSize: 11, color: AppColors.honeyYellow)),
                      ),
                      const SizedBox(width: 8),
                      // Amount Display & Edit
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: person.paidAmount > 0 ? AppColors.honeyYellow : AppColors.border,
                          ),
                        ),
                        child: Text(
                          formatMoney(person.paidAmount, currency),
                          style: TextStyle(
                            color: person.paidAmount > 0 ? AppColors.honeyYellow : Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
