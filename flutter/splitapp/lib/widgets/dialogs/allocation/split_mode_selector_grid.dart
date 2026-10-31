import 'package:flutter/material.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';

class SplitModeSelectorGrid extends StatelessWidget {
  final SplitMode selectedMode;
  final ValueChanged<SplitMode> onSelectMode;

  const SplitModeSelectorGrid({
    super.key,
    required this.selectedMode,
    required this.onSelectMode,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      childAspectRatio: 2.6,
      physics: const NeverScrollableScrollPhysics(),
      children: SplitMode.values.map((mode) {
        final isSelected = selectedMode == mode;
        return InkWell(
          onTap: () => onSelectMode(mode),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primarySubtle
                  : AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.border,
                width: 1.5,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  mode.label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isSelected
                        ? AppColors.primaryLight
                        : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  mode.hint,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style:
                      const TextStyle(fontSize: 10, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
