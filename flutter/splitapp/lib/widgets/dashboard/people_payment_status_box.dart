import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';

class PeoplePaymentStatusBox extends StatelessWidget {
  final bool paidMatches;
  final int paidTotal;
  final int billTotal;
  final CurrencyCode currency;

  const PeoplePaymentStatusBox({
    super.key,
    required this.paidMatches,
    required this.paidTotal,
    required this.billTotal,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color:
            paidMatches ? AppColors.successSubtle : AppColors.warningSubtle,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: paidMatches
              ? AppColors.success.withValues(alpha: 0.3)
              : AppColors.warning.withValues(alpha: 0.3),
        ),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 8,
        runSpacing: 4,
        children: [
          Text(
            paidMatches ? 'Paid matches total' : 'Paid so far',
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
          ),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'monospace',
                  color: paidMatches ? AppColors.success : AppColors.warning,
                ),
                children: [
                  TextSpan(text: formatMoney(paidTotal, currency)),
                  TextSpan(
                    text: ' of ${formatMoney(billTotal, currency)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.normal,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
