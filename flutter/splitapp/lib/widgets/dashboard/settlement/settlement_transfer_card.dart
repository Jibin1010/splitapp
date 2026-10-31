import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';
import '../../common/person_avatar.dart';

class SettlementTransferCard extends StatelessWidget {
  final Settlement settlement;
  final Person from;
  final Person to;
  final CurrencyCode currency;
  final Person? activePerson;

  const SettlementTransferCard({
    super.key,
    required this.settlement,
    required this.from,
    required this.to,
    required this.currency,
    required this.activePerson,
  });

  @override
  Widget build(BuildContext context) {
    final isYouPaying = activePerson != null && settlement.fromPersonId == activePerson!.id;
    final isYouReceiving = activePerson != null && settlement.toPersonId == activePerson!.id;
    final isInvolved = isYouPaying || isYouReceiving;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 5),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isInvolved
            ? (isYouReceiving
                ? AppColors.mintSage.withValues(alpha: 0.12)
                : AppColors.coral.withValues(alpha: 0.12))
            : AppColors.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isInvolved
              ? (isYouReceiving ? AppColors.mintSage : AppColors.coral)
              : AppColors.border,
          width: isInvolved ? 1.6 : 1.0,
        ),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 8,
        runSpacing: 6,
        children: [
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 6,
            runSpacing: 4,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  PersonAvatar(name: from.name, photo: from.photo, size: AvatarSize.xs),
                  const SizedBox(width: 5),
                  Text(
                    from.name,
                    style: TextStyle(
                      color: isYouPaying ? AppColors.coral : Colors.white,
                      fontSize: 12,
                      fontWeight: isYouPaying ? FontWeight.w900 : FontWeight.w700,
                    ),
                  ),
                  if (isYouPaying) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.coral,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'YOU',
                        style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ],
              ),
              const Icon(Icons.arrow_forward_rounded, size: 13, color: AppColors.textSecondary),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  PersonAvatar(name: to.name, photo: to.photo, size: AvatarSize.xs),
                  const SizedBox(width: 5),
                  Text(
                    to.name,
                    style: TextStyle(
                      color: isYouReceiving ? AppColors.mintSage : Colors.white,
                      fontSize: 12,
                      fontWeight: isYouReceiving ? FontWeight.w900 : FontWeight.w700,
                    ),
                  ),
                  if (isYouReceiving) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.mintSage,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'YOU',
                        style: TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isYouReceiving
                  ? AppColors.mintSage.withValues(alpha: 0.2)
                  : (isYouPaying ? AppColors.coral.withValues(alpha: 0.2) : AppColors.surfaceElevated),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isYouReceiving
                    ? AppColors.mintSage
                    : (isYouPaying ? AppColors.coral : AppColors.border),
                width: 1.0,
              ),
            ),
            child: Text(
              formatMoney(settlement.amount, currency),
              style: TextStyle(
                color: isYouReceiving
                    ? AppColors.mintSage
                    : (isYouPaying ? AppColors.coral : Colors.white),
                fontSize: 12,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
