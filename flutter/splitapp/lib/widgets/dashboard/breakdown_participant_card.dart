import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';
import '../common/person_avatar.dart';

class BreakdownParticipantCard extends StatelessWidget {
  final Person person;
  final bool isActive;
  final int share;
  final int net;
  final CurrencyCode currency;

  const BreakdownParticipantCard({
    super.key,
    required this.person,
    required this.isActive,
    required this.share,
    required this.net,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    final isHeadPayer = person.paidAmount > 0;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isActive
            ? AppColors.electricIris.withValues(alpha: 0.12)
            : AppColors.surfaceSubtle,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isActive
              ? AppColors.electricIris
              : (isHeadPayer
                  ? AppColors.honeyYellow.withValues(alpha: 0.4)
                  : AppColors.borderSubtle),
          width: isActive ? 1.8 : 1.0,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PersonAvatar(
            name: person.name,
            photo: person.photo,
            size: AvatarSize.md,
            showBadge: isActive,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            person.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          if (isActive)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.electricIris,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'YOU',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          if (isHeadPayer)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.honeyYellow
                                    .withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                    color: AppColors.honeyYellow, width: 0.8),
                              ),
                              child: const Text(
                                '👑 Head Payer',
                                style: TextStyle(
                                  color: AppColors.honeyYellow,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        formatMoney(share, currency),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        isHeadPayer
                            ? 'Paid upfront ${formatMoney(person.paidAmount, currency)}'
                            : 'Consumes ${formatMoney(share, currency)}',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      net > 0
                          ? 'Gets back ${formatMoney(net, currency)}'
                          : net < 0
                              ? 'Owes ${formatMoney(-net, currency)}'
                              : 'Settled ✓',
                      style: TextStyle(
                        color: net > 0
                            ? AppColors.mintSage
                            : net < 0
                                ? AppColors.coral
                                : AppColors.textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
