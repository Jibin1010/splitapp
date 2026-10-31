import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';

class PerspectiveShareCard extends StatelessWidget {
  final int share;
  final CurrencyCode currency;
  final double sharePercentage;
  final bool hasItems;

  const PerspectiveShareCard({
    super.key,
    required this.share,
    required this.currency,
    required this.sharePercentage,
    required this.hasItems,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFEDF5FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFDBEAFE)),
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
                  color: const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.pie_chart_outline_rounded,
                  size: 13,
                  color: Color(0xFF2563EB),
                ),
              ),
              const SizedBox(width: 4),
              const Expanded(
                child: Text(
                  'YOUR SHARE',
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
                  color: Color(0xFFDBEAFE),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.chevron_right_rounded,
                  size: 12,
                  color: Color(0xFF2563EB),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              formatMoney(share, currency),
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
            hasItems
                ? '${sharePercentage.toStringAsFixed(1)}% of total bill'
                : 'Assigned items & taxes',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 9,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: (sharePercentage / 100).clamp(0.03, 1.0),
                    backgroundColor: const Color(0xFFDBEAFE),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
                    minHeight: 3.5,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Text(
                '${sharePercentage.toStringAsFixed(1)}%',
                style: const TextStyle(
                  color: Color(0xFF475569),
                  fontSize: 8.5,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
