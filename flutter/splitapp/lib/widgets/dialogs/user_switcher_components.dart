import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';
import '../common/person_avatar.dart';

class UserSwitcherProfileCard extends StatelessWidget {
  final Person person;
  final bool isSelected;
  final int share;
  final int paid;
  final int net;
  final CurrencyCode currency;
  final VoidCallback onTap;

  const UserSwitcherProfileCard({
    super.key,
    required this.person,
    required this.isSelected,
    required this.share,
    required this.paid,
    required this.net,
    required this.currency,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.electricIris.withValues(alpha: 0.15)
              : AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.electricIris : AppColors.borderSubtle,
            width: isSelected ? 1.8 : 1,
          ),
        ),
        child: Row(
          children: [
            PersonAvatar(
              name: person.name,
              photo: person.photo,
              size: AvatarSize.md,
              isPayer: paid > 0,
              showBadge: isSelected,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 5,
                    runSpacing: 3,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        person.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      if (isSelected)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.electricIris,
                            borderRadius: BorderRadius.circular(10),
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
                      if (paid > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.honeyYellow.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: AppColors.honeyYellow
                                    .withValues(alpha: 0.4)),
                          ),
                          child: const Text(
                            'PAYER',
                            style: TextStyle(
                              color: AppColors.honeyYellow,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'Share: ${formatMoney(share, currency)}${paid > 0 ? ' • Paid: ${formatMoney(paid, currency)}' : ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            // Net balance badge
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: net > 0
                        ? AppColors.mintSage.withValues(alpha: 0.15)
                        : (net < 0
                            ? AppColors.coral.withValues(alpha: 0.15)
                            : Colors.white.withValues(alpha: 0.08)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    net > 0
                        ? '+${formatMoney(net, currency)}'
                        : (net < 0 ? formatMoney(net, currency) : 'Settled'),
                    style: TextStyle(
                      color: net > 0
                          ? AppColors.mintSage
                          : (net < 0 ? AppColors.coral : Colors.white70),
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  net > 0 ? 'gets back' : (net < 0 ? 'owes' : 'balanced'),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 9,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 8),
            Icon(
              isSelected
                  ? Icons.check_circle_rounded
                  : Icons.radio_button_unchecked_rounded,
              color: isSelected ? AppColors.electricIris : Colors.white24,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

class UserSwitcherAddForm extends StatelessWidget {
  final TextEditingController controller;
  final String? errorText;
  final VoidCallback onCancel;
  final VoidCallback onSubmit;

  const UserSwitcherAddForm({
    super.key,
    required this.controller,
    required this.errorText,
    required this.onCancel,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.electricIris.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'ADD PERSON PROFILE',
            style: TextStyle(
              color: AppColors.electricIris,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            autofocus: true,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Enter name (e.g. Alex, Sam)',
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
              errorText: errorText,
              isDense: true,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              filled: true,
              fillColor: AppColors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.electricIris),
              ),
            ),
            onSubmitted: (_) => onSubmit(),
          ),
          const SizedBox(height: 10),
          Wrap(
            alignment: WrapAlignment.end,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 6,
            children: [
              TextButton(
                onPressed: onCancel,
                child: const Text('Cancel',
                    style: TextStyle(color: Colors.white60)),
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.check_rounded, size: 16),
                label: const Text('Create & View As'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.electricIris,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: onSubmit,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
