import 'package:flutter/material.dart';
import '../../models/split_types.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';

class SettingsDialog extends StatelessWidget {
  final BillState state;

  const SettingsDialog({super.key, required this.state});

  void _confirmClearAll(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear all local data?'),
        content: const Text(
          'The current draft, all saved history and preferences will be deleted from this device, and the workspace resets to the example bill.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          OutlinedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              Navigator.of(ctx).pop(); // pop confirm
              Navigator.of(context).pop(); // pop settings
              await state.resetAllData();
            },
            child: const Text('Clear everything'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.settings_rounded, size: 22, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text(
                        'Settings',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Currency and local data preferences. No account, no sync.',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              const SizedBox(height: 18),

              // Currency Selector
              const Text(
                'Currency',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<CurrencyCode>(
                    value: state.bill.currency,
                    isExpanded: true,
                    dropdownColor: AppColors.surfaceElevated,
                    style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                    items: CurrencyCode.values.map((code) {
                      final meta = currencyMetaMap[code]!;
                      return DropdownMenuItem(
                        value: code,
                        child: Text(meta.label),
                      );
                    }).toList(),
                    onChanged: (code) {
                      if (code != null) state.setCurrency(code);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Applies to the current bill and becomes the default for new bills.',
                style: TextStyle(fontSize: 11, color: AppColors.textMuted),
              ),
              const SizedBox(height: 16),

              // Privacy Notice Box
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
                        Icon(Icons.shield_outlined, size: 16, color: AppColors.success),
                        SizedBox(width: 6),
                        Text(
                          'Privacy',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'SplitLedger needs no account. Drafts, history and settings stay stored securely on this device. They won’t sync to external servers, and clearing stored data permanently removes them.',
                      style: TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Local Data Box
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
                        Icon(Icons.storage_rounded, size: 16, color: AppColors.primary),
                        SizedBox(width: 6),
                        Text(
                          'Local data',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '“Clear all data” wipes the autosaved draft, saved history and settings, then restores the example bill. There is no way to undo this.',
                      style: TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.4),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.danger,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      onPressed: () => _confirmClearAll(context),
                      icon: const Icon(Icons.delete_forever_rounded, size: 16),
                      label: const Text('Clear all data', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
