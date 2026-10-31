import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';

class VisionImportFooter extends StatelessWidget {
  final bool replaceItems;
  final ValueChanged<bool> onToggleReplace;
  final VoidCallback onImport;
  final VoidCallback onCancel;
  final bool isImporting;
  final bool hasItems;

  const VisionImportFooter({
    super.key,
    required this.replaceItems,
    required this.onToggleReplace,
    required this.onImport,
    required this.onCancel,
    this.isImporting = false,
    this.hasItems = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Checkbox(
                value: replaceItems,
                onChanged: (val) => onToggleReplace(val ?? true),
                activeColor: AppColors.mintSage,
              ),
              const Text(
                'Replace current products',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextButton(
                onPressed: onCancel,
                child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: (!hasItems || isImporting) ? null : onImport,
                icon: isImporting
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                      )
                    : const Icon(Icons.check_circle_rounded, size: 16),
                label: Text(
                  isImporting ? 'Importing...' : 'Import to Bill Split',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.mintSage,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
