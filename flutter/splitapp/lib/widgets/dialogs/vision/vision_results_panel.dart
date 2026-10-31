import 'package:flutter/material.dart';
import '../../../models/vision_types.dart';
import '../../../state/bill_state.dart';
import '../../../theme/app_theme.dart';
import '../../common/app_badge.dart';
import 'vision_detected_items_tab.dart';
import 'vision_text_tabs.dart';

class VisionResultsPanel extends StatelessWidget {
  final VisionApiResponse result;
  final List<DetectedBillItem> itemsList;
  final int activeTab;
  final ValueChanged<int> onTabChanged;
  final BillState state;
  final VoidCallback onImportDone;

  const VisionResultsPanel({
    super.key,
    required this.result,
    required this.itemsList,
    required this.activeTab,
    required this.onTabChanged,
    required this.state,
    required this.onImportDone,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const Icon(Icons.receipt_rounded, size: 16, color: AppColors.primaryLight),
              Text(
                result.vendor ?? 'Extracted Receipt Details',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              if (result.date != null)
                AppBadge(variant: BadgeVariant.outline, label: '📅 ${result.date}'),
              if (result.invoiceNumber != null && result.invoiceNumber!.isNotEmpty)
                AppBadge(variant: BadgeVariant.outline, label: '#${result.invoiceNumber}'),
              if (result.durationMs != null)
                AppBadge(
                  variant: BadgeVariant.secondary,
                  label: '⚡ ${(result.durationMs! / 1000).toStringAsFixed(2)}s',
                ),
              if (result.model != null)
                AppBadge(variant: BadgeVariant.outline, label: result.model!),
            ],
          ),

          if (result.fallbackUsed) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.warningSubtle,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
              ),
              child: Text(
                'Primary model timed out; completed via fallback ${result.model}.',
                style: const TextStyle(fontSize: 11, color: AppColors.warning),
              ),
            ),
          ],

          if (result.ok) ...[
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildTabButton(0, 'Products & Split Setup', Icons.receipt_long_rounded),
                  const SizedBox(width: 6),
                  _buildTabButton(1, 'Exact Raw OCR', Icons.code_rounded),
                  const SizedBox(width: 6),
                  _buildTabButton(2, 'AI Notes', Icons.notes_rounded),
                ],
              ),
            ),
            const SizedBox(height: 12),

            if (activeTab == 0)
              VisionDetectedItemsTab(
                state: state,
                result: result,
                initialDetectedItems: itemsList,
                onImportDone: onImportDone,
              ),

            if (activeTab == 1)
              VisionRawTextTab(rawText: result.rawText),

            if (activeTab == 2)
              VisionNotesTab(description: result.description),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.dangerSubtle,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Analysis Failed',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.danger,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    result.errorMessage ?? 'Unknown error occurred.',
                    style: const TextStyle(fontSize: 11, color: AppColors.danger),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTabButton(int index, String label, IconData icon) {
    final isSelected = activeTab == index;
    return InkWell(
      onTap: () => onTabChanged(index),
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: isSelected ? Colors.white : AppColors.textMuted),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
