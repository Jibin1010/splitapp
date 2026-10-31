import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';

class SummaryCards extends StatelessWidget {
  final BillState state;

  const SummaryCards({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final preview = state.preview;
    final bill = state.bill;
    final active = state.activePerson;
    final hasAdjustments = preview.adjustmentsTotal != 0;
    final unassigned = preview.unassignedValue;

    final activeShare = active != null ? (preview.people[active.id]?.share ?? 0) : null;
    final activePct = activeShare != null && preview.billTotal > 0
        ? ((activeShare / preview.billTotal) * 100).toStringAsFixed(1)
        : null;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 768;
        final isNarrow = constraints.maxWidth < 340;
        final cardWidth = isWide
            ? (constraints.maxWidth - 36) / 4
            : (isNarrow
                ? constraints.maxWidth
                : (constraints.maxWidth - 12) / 2);

        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: cardWidth,
              child: _SummaryCard(
                icon: Icons.receipt_long_rounded,
                label: 'BILL TOTAL (INCL. GST)',
                value: formatMoney(preview.billTotal, bill.currency),
                hint: active != null && activeShare != null
                    ? '${active.name}: ${formatMoney(activeShare, bill.currency)} ($activePct%)'
                    : hasAdjustments
                        ? 'Products ${formatMoney(preview.itemsTotal, bill.currency)} + GST ${formatMoney(preview.adjustmentsTotal, bill.currency)}'
                        : 'Sum of all product lines',
                accentColor: AppColors.electricIris,
              ),
            ),
            SizedBox(
              width: cardWidth,
              child: _SummaryCard(
                icon: Icons.people_alt_rounded,
                label: 'PARTICIPANTS',
                value: bill.people.length.toString(),
                hint: bill.people.isEmpty
                    ? 'Add people splitting bill'
                    : '${bill.people.length} participants',
                accentColor: AppColors.honeyAmber,
              ),
            ),
            SizedBox(
              width: cardWidth,
              child: _SummaryCard(
                icon: Icons.inventory_2_rounded,
                label: 'PRODUCTS',
                value: bill.items.length.toString(),
                hint: bill.items.isEmpty
                    ? 'Add bill line items'
                    : '${bill.items.length} line items recorded',
                accentColor: AppColors.mintSage,
              ),
            ),
            SizedBox(
              width: cardWidth,
              child: _SummaryCard(
                icon: unassigned > 0 ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
                label: 'UNASSIGNED',
                value: formatMoney(unassigned, bill.currency),
                hint: unassigned > 0
                    ? 'Value not yet allocated'
                    : 'All items assigned ✓',
                accentColor: unassigned > 0 ? AppColors.coralRed : AppColors.mintSage,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String hint;
  final Color accentColor;

  const _SummaryCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.hint,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: accentColor.withValues(alpha: 0.25),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Icon(icon, size: 18, color: accentColor),
              ),
              Icon(Icons.arrow_outward_rounded, size: 16, color: accentColor.withValues(alpha: 0.6)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 3),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              maxLines: 1,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                fontFamily: 'monospace',
                letterSpacing: -0.5,
                color: accentColor,
              ),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            hint,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
