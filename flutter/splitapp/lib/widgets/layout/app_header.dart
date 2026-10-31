import 'package:flutter/material.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';

class AppHeader extends StatelessWidget {
  final BillState state;
  final VoidCallback onOpenHistory;
  final VoidCallback onOpenSettings;
  final VoidCallback onOpenVision;
  final VoidCallback? onOpenMobileDrawer;

  const AppHeader({
    super.key,
    required this.state,
    required this.onOpenHistory,
    required this.onOpenSettings,
    required this.onOpenVision,
    this.onOpenMobileDrawer,
  });

  String _formatTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }

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
    final bill = state.bill;
    String savedHint = 'Autosaves to this device as you edit';
    if (state.savedAt != null) {
      savedHint = 'Saved to History · ${_formatTime(state.savedAt!)}';
    } else if (state.draftSavedAt != null) {
      savedHint = 'Autosaved locally · ${_formatTime(state.draftSavedAt!)}';
    }

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          if (onOpenMobileDrawer != null) ...[
            IconButton(
              icon: const Icon(Icons.menu_rounded, size: 22),
              color: AppColors.textSecondary,
              onPressed: onOpenMobileDrawer,
            ),
            const SizedBox(width: 8),
          ],

          // Title & Tagline
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 32,
                  child: TextField(
                    controller: TextEditingController(text: bill.name)
                      ..selection = TextSelection.collapsed(offset: bill.name.length),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'Shared Bill',
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      filled: false,
                      contentPadding: EdgeInsets.zero,
                    ),
                    onChanged: (val) => state.setBillName(val),
                  ),
                ),
                const Text(
                  'Add items, assign people, split fairly',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
              ],
            ),
          ),

          // Autosave Hint
          LayoutBuilder(builder: (ctx, constraints) {
            final screenWidth = MediaQuery.of(context).size.width;
            final isCompact = screenWidth < 720;
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (screenWidth >= 800) ...[
                  Text(
                    savedHint,
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                  const SizedBox(width: 12),
                ],
                if (isCompact) ...[
                  IconButton(
                    tooltip: 'AI Scan / Describe',
                    onPressed: onOpenVision,
                    icon: const Icon(Icons.auto_awesome, size: 18, color: AppColors.primaryLight),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.primarySubtle,
                      padding: const EdgeInsets.all(8),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    tooltip: 'Save Draft',
                    onPressed: () async {
                      await state.saveNamedDraft();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Saved draft to History!'),
                            backgroundColor: AppColors.success,
                            duration: Duration(seconds: 2),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.save_outlined, size: 18),
                    style: IconButton.styleFrom(
                      padding: const EdgeInsets.all(8),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    tooltip: 'New Split',
                    onPressed: () => _handleNewSplit(context),
                    icon: const Icon(Icons.note_add_outlined, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(8),
                    ),
                  ),
                ] else ...[
                  OutlinedButton.icon(
                    onPressed: onOpenVision,
                    icon: const Icon(Icons.auto_awesome, size: 14, color: AppColors.primaryLight),
                    label: const Text('AI Scan', style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                      backgroundColor: AppColors.primarySubtle,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () async {
                      await state.saveNamedDraft();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Saved draft to History!'),
                            backgroundColor: AppColors.success,
                            duration: Duration(seconds: 2),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.save_outlined, size: 14),
                    label: const Text('Save Draft', style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: () => _handleNewSplit(context),
                    icon: const Icon(Icons.note_add_outlined, size: 14),
                    label: const Text('New Split', style: TextStyle(fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    ),
                  ),
                ],
              ],
            );
          }),
        ],
      ),
    );
  }
}
