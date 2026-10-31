import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import 'vision_dialog_models.dart';

class VisionModelSelector extends StatelessWidget {
  final String selectedModel;
  final ValueChanged<String> onSelectModel;

  const VisionModelSelector({
    super.key,
    required this.selectedModel,
    required this.onSelectModel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'VISION MODEL',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: availableVisionModels.map((m) {
              final isSelected = selectedModel == m.id;
              return InkWell(
                onTap: () => onSelectModel(m.id),
                borderRadius: BorderRadius.circular(6),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primarySubtle : AppColors.surface,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.border,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.bolt_rounded,
                        size: 14,
                        color: isSelected ? AppColors.primaryLight : AppColors.textMuted,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        m.name,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                          color: isSelected ? AppColors.primaryLight : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '(${m.badge})',
                        style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class VisionPromptSelector extends StatelessWidget {
  final String selectedPromptId;
  final ValueChanged<String> onSelectPromptId;

  const VisionPromptSelector({
    super.key,
    required this.selectedPromptId,
    required this.onSelectPromptId,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'EXTRACTION MODE',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          children: presetVisionPrompts.map((p) {
            final isSelected = selectedPromptId == p.id;
            return InkWell(
              onTap: () => onSelectPromptId(p.id),
              borderRadius: BorderRadius.circular(6),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primarySubtle : AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : AppColors.border,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Text(
                  p.label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    color: isSelected ? AppColors.primaryLight : AppColors.textSecondary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
