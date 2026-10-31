import 'package:flutter/material.dart';
import '../../models/split_types.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';

import '../common/person_avatar.dart';
import '../dialogs/user_switcher_sheet.dart';

/// Tubik Style Restaurant Operations App Header
/// Displays active user profile, multi-login switch, venue selector & utility shortcuts
class TubikAppHeader extends StatelessWidget {
  final BillState state;
  final VoidCallback onOpenAiLead;
  final VoidCallback onOpenSettings;
  final VoidCallback onOpenHistory;

  const TubikAppHeader({
    super.key,
    required this.state,
    required this.onOpenAiLead,
    required this.onOpenSettings,
    required this.onOpenHistory,
  });

  @override
  Widget build(BuildContext context) {
    final bill = state.bill;
    final venueName = bill.vendor ?? (bill.name.isEmpty ? 'The Daily Grind, NY' : bill.name);
    final active = state.activePerson;
    final activeName = active?.name ?? 'Guest';
    final isPayer = active != null && active.paidAmount > 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Top Row: Avatar Greeting, User Switcher & Utilities
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Avatar & Greeting (Tappable to Switch User - Responsive for mobile)
            Expanded(
              child: InkWell(
                onTap: () => UserSwitcherSheet.show(context, state),
                borderRadius: BorderRadius.circular(24),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 2),
                  child: Row(
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          PersonAvatar(
                            name: activeName,
                            photo: active?.photo,
                            size: AvatarSize.md,
                            isPayer: isPayer,
                            ring: true,
                          ),
                          Positioned(
                            right: -2,
                            bottom: -2,
                            child: Container(
                              width: 15,
                              height: 15,
                              decoration: BoxDecoration(
                                color: AppColors.electricIris,
                                shape: BoxShape.circle,
                                border: Border.all(color: AppColors.background, width: 1.5),
                              ),
                              child: const Icon(Icons.sync_rounded, size: 9, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    'Hi, $activeName!',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.keyboard_arrow_down_rounded,
                                  size: 16,
                                  color: AppColors.textSecondary,
                                ),
                              ],
                            ),
                            Text(
                              isPayer ? 'Head Payer • Tap to switch' : 'Active Profile • Tap to switch',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: isPayer ? AppColors.honeyYellow : AppColors.mintSage,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),

            // User Switcher Icon, History, AI Lead & Settings
            Row(
              children: [
                _buildCircleButton(
                  icon: Icons.switch_account_rounded,
                  color: AppColors.surface,
                  iconColor: AppColors.electricIris,
                  onTap: () => UserSwitcherSheet.show(context, state),
                ),
                const SizedBox(width: 7),
                _buildCircleButton(
                  icon: Icons.history_rounded,
                  onTap: onOpenHistory,
                ),
                const SizedBox(width: 7),
                _buildCircleButton(
                  icon: Icons.auto_awesome_rounded,
                  color: AppColors.electricIris,
                  iconColor: Colors.white,
                  onTap: onOpenAiLead,
                ),
                const SizedBox(width: 7),
                Stack(
                  children: [
                    _buildCircleButton(
                      icon: Icons.notifications_none_rounded,
                      onTap: onOpenSettings,
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.coral,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Venue / Store Selector Pill (e.g. ☕ The Daily Grind, NY ▾)
        Row(
          children: [
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('☕', style: TextStyle(fontSize: 13)),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        venueName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: AppColors.textSecondary),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Text(
                bill.currency.code,
                style: const TextStyle(
                  color: AppColors.honeyYellow,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCircleButton({
    required IconData icon,
    required VoidCallback onTap,
    Color color = AppColors.surface,
    Color iconColor = Colors.white,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.border),
        ),
        child: Center(
          child: Icon(icon, size: 17, color: iconColor),
        ),
      ),
    );
  }
}
