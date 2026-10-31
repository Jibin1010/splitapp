import 'package:flutter/material.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import '../common/person_avatar.dart';
import '../dialogs/user_switcher_sheet.dart';
export 'perspective/personal_spotlight_card.dart';
export 'perspective/perspective_card_footer.dart';
export 'perspective/perspective_card_header.dart';
export 'perspective/perspective_custom_painters.dart';
export 'perspective/perspective_metric_cards.dart';
export 'perspective/perspective_settlement_strip.dart';

/// Quick 1-tap horizontal chip carousel allowing users to switch who they are viewing as ("Multi-Login")
class UserPerspectiveBar extends StatelessWidget {
  final BillState state;

  const UserPerspectiveBar({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final bill = state.bill;
    final people = bill.people;
    final active = state.activePerson;

    if (people.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Label with switch icon
          GestureDetector(
            onTap: () => UserSwitcherSheet.show(context, state),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: AppColors.electricIris.withValues(alpha: 0.18),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.switch_account_rounded,
                    size: 15,
                    color: AppColors.electricIris,
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'View as:',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Scrollable chips
          Expanded(
            child: SizedBox(
              height: 32,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: people.length + 1,
                separatorBuilder: (_, _) => const SizedBox(width: 6),
                itemBuilder: (context, index) {
                  if (index == people.length) {
                    // + Add / Switch Button
                    return InkWell(
                      onTap: () => UserSwitcherSheet.show(context, state),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        alignment: Alignment.center,
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add_rounded, size: 14, color: AppColors.electricIris),
                            SizedBox(width: 4),
                            Text(
                              'Switch',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  final person = people[index];
                  final isSelected = active?.id == person.id;

                  return InkWell(
                    onTap: () => state.setActivePerson(person.id),
                    borderRadius: BorderRadius.circular(16),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.electricIris
                            : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? Colors.white : AppColors.borderSubtle,
                          width: isSelected ? 1.5 : 1,
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: AppColors.electricIris.withValues(alpha: 0.45),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                )
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          PersonAvatar(
                            name: person.name,
                            photo: person.photo,
                            size: AvatarSize.xs,
                            ring: false,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            person.name,
                            style: TextStyle(
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                            ),
                          ),
                          if (isSelected) ...[
                            const SizedBox(width: 4),
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
