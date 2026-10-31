import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';

class ReconciliationAlertCard extends StatelessWidget {
  final bool isBalanced;
  final int headPayersCount;
  final int totalPaid;
  final int billTotal;
  final CurrencyCode currency;
  final VoidCallback onTap;

  const ReconciliationAlertCard({
    super.key,
    required this.isBalanced,
    required this.headPayersCount,
    required this.totalPaid,
    required this.billTotal,
    required this.currency,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isBalanced
                ? AppColors.border
                : AppColors.coral.withValues(alpha: 0.6),
            width: 1.2,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Row(
          children: [
            // Yellow / Amber Hexagon / Alert Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isBalanced
                    ? AppColors.mintSage.withValues(alpha: 0.15)
                    : AppColors.honeyYellow.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isBalanced
                      ? AppColors.mintSage
                      : AppColors.honeyYellow,
                  width: 1.2,
                ),
              ),
              child: Center(
                child: Icon(
                  isBalanced
                      ? Icons.check_circle_rounded
                      : Icons.shield_rounded,
                  color:
                      isBalanced ? AppColors.mintSage : AppColors.honeyYellow,
                  size: 22,
                ),
              ),
            ),
            const SizedBox(width: 14),

            // Title & Subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isBalanced
                        ? 'SETTLEMENT BALANCED'
                        : 'STABILIZING LABOR & COST',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    isBalanced
                        ? '$headPayersCount head payer(s) covered ${formatMoney(totalPaid, currency)}. Ready for audit.'
                        : 'Record who paid upfront. Difference: ${formatMoney((billTotal - totalPaid).abs(), currency)}.',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            // Tubik signature diagonal arrow button ↗
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: const Center(
                child: Icon(
                  Icons.north_east_rounded,
                  color: Colors.white,
                  size: 16,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
