import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';

class RevenueUserBanner extends StatelessWidget {
  final Person active;
  final int activeShare;
  final int activePaid;
  final double activePercent;
  final CurrencyCode currency;

  const RevenueUserBanner({
    super.key,
    required this.active,
    required this.activeShare,
    required this.activePaid,
    required this.activePercent,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.32),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.25),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              active.name.toUpperCase(),
              style: const TextStyle(
                color: Colors.black,
                fontSize: 9,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Your Share: ${formatMoney(activeShare, currency)} (${activePercent.toStringAsFixed(1)}% of bill)',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          if (activePaid > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.honeyYellow,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'PAYER',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
