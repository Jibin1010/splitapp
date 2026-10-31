import 'package:flutter/material.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';

class AppSidebar extends StatelessWidget {
  final BillState state;
  final VoidCallback onOpenHistory;
  final VoidCallback onOpenSettings;
  final VoidCallback onOpenVision;
  final VoidCallback onScrollToPeople;
  final VoidCallback onScrollToTop;

  const AppSidebar({
    super.key,
    required this.state,
    required this.onOpenHistory,
    required this.onOpenSettings,
    required this.onOpenVision,
    required this.onScrollToPeople,
    required this.onScrollToTop,
  });

  void _handleNewSplit(BuildContext context) {
    final hasContent = state.bill.items.isNotEmpty || state.bill.people.isNotEmpty;
    if (hasContent) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Start a new split?'),
          content: const Text(
            'This clears the current bill and starts a fresh one. If you want to keep this bill, use “Save Draft” first — it will stay in History.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          actions: [
            OutlinedButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
              onPressed: () {
                Navigator.of(ctx).pop();
                state.newBill();
              },
              child: const Text('Start new split'),
            ),
          ],
        ),
      );
    } else {
      state.newBill();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 240,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(right: BorderSide(color: AppColors.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Brand Logo
          InkWell(
            onTap: onScrollToTop,
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding: const EdgeInsets.all(4),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.call_split_rounded, size: 22, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'SplitLedger',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.3,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          'Split fairly, settle fast',
                          style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Nav Items
          _NavItem(
            icon: Icons.dashboard_outlined,
            label: 'Overview',
            active: true,
            onTap: onScrollToTop,
          ),
          const SizedBox(height: 4),
          _NavItem(
            icon: Icons.note_add_outlined,
            label: 'New Split',
            onTap: () => _handleNewSplit(context),
          ),
          const SizedBox(height: 4),
          _NavItem(
            icon: Icons.auto_awesome,
            label: 'AI Vision & Bills',
            iconColor: AppColors.primaryLight,
            onTap: onOpenVision,
          ),
          const SizedBox(height: 4),
          _NavItem(
            icon: Icons.people_outline_rounded,
            label: 'People',
            onTap: onScrollToPeople,
          ),
          const SizedBox(height: 4),
          _NavItem(
            icon: Icons.history_rounded,
            label: 'History',
            onTap: onOpenHistory,
          ),
          const SizedBox(height: 4),
          _NavItem(
            icon: Icons.settings_outlined,
            label: 'Settings',
            onTap: onOpenSettings,
          ),

          const Spacer(),

          // Info Box
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.info_outline_rounded, size: 14, color: AppColors.primaryLight),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'No account needed',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Your bill lives on this device only. No sign-up, no cloud, no tracking. Save drafts to keep copies in History.',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;
  final Color? iconColor;

  const _NavItem({
    required this.icon,
    required this.label,
    this.active = false,
    required this.onTap,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AppColors.primarySubtle : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 18,
              color: active ? AppColors.primary : (iconColor ?? AppColors.textMuted),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                  color: active ? AppColors.primaryLight : AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
