import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';

class PerspectiveNetCard extends StatelessWidget {
  final int net;
  final CurrencyCode currency;

  const PerspectiveNetCard({
    super.key,
    required this.net,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: net < 0
            ? const Color(0xFFFFF1F2)
            : (net > 0 ? const Color(0xFFECFDF5) : const Color(0xFFF8FAFC)),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: net < 0
              ? const Color(0xFFFECDD3)
              : (net > 0 ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0)),
        ),
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
                  color: net < 0
                      ? const Color(0xFFFFE4E6)
                      : (net > 0
                          ? const Color(0xFFD1FAE5)
                          : const Color(0xFFF1F5F9)),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(
                  net < 0
                      ? Icons.north_east_rounded
                      : (net > 0
                          ? Icons.south_west_rounded
                          : Icons.check_circle_outline_rounded),
                  size: 13,
                  color: net < 0
                      ? const Color(0xFFE11D48)
                      : (net > 0 ? const Color(0xFF059669) : const Color(0xFF64748B)),
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  net < 0 ? 'YOU OWE' : (net > 0 ? 'YOU RECEIVE' : 'BALANCE'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: net < 0
                        ? const Color(0xFFE11D48)
                        : (net > 0 ? const Color(0xFF059669) : const Color(0xFF64748B)),
                    fontSize: 7.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: net < 0
                      ? const Color(0xFFFFE4E6)
                      : (net > 0 ? const Color(0xFFD1FAE5) : const Color(0xFFF1F5F9)),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.chevron_right_rounded,
                  size: 12,
                  color: net < 0
                      ? const Color(0xFFE11D48)
                      : (net > 0 ? const Color(0xFF059669) : const Color(0xFF64748B)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              net < 0
                  ? formatMoney(net.abs(), currency)
                  : (net > 0 ? '+${formatMoney(net, currency)}' : formatMoney(0, currency)),
              style: TextStyle(
                color: net < 0
                    ? const Color(0xFFE11D48)
                    : (net > 0 ? const Color(0xFF059669) : const Color(0xFF0F172A)),
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            net < 0
                ? 'To pay to front payers'
                : (net > 0 ? 'To collect from group' : 'All square with group'),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: net < 0
                  ? const Color(0xFFE11D48).withValues(alpha: 0.8)
                  : (net > 0
                      ? const Color(0xFF059669).withValues(alpha: 0.8)
                      : const Color(0xFF64748B)),
              fontSize: 9,
            ),
          ),
          const SizedBox(height: 9.5),
        ],
      ),
    );
  }
}
