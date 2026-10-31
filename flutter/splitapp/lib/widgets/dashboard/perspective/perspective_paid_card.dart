import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';

class PerspectivePaidCard extends StatelessWidget {
  final int paid;
  final CurrencyCode currency;

  const PerspectivePaidCard({
    super.key,
    required this.paid,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFEFFCF6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD1FAE5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.account_balance_wallet_outlined,
                  size: 13,
                  color: Color(0xFF059669),
                ),
              ),
              const SizedBox(width: 4),
              const Expanded(
                child: Text(
                  'YOU PAID',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 7.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
              Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                  color: Color(0xFFD1FAE5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.chevron_right_rounded,
                  size: 12,
                  color: Color(0xFF059669),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              formatMoney(paid, currency),
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            paid > 0 ? 'Fronted upfront' : 'No payments fronted',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 9,
            ),
          ),
          const SizedBox(height: 9.5),
        ],
      ),
    );
  }
}
