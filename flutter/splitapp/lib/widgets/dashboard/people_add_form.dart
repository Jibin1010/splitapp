import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class PeopleAddForm extends StatelessWidget {
  final String newName;
  final String newPhoto;
  final bool showPhotoInput;
  final String? duplicateWarning;
  final ValueChanged<String> onNameChanged;
  final ValueChanged<String> onPhotoChanged;
  final VoidCallback onTogglePhotoInput;
  final VoidCallback onAddPerson;

  const PeopleAddForm({
    super.key,
    required this.newName,
    required this.newPhoto,
    required this.showPhotoInput,
    required this.duplicateWarning,
    required this.onNameChanged,
    required this.onPhotoChanged,
    required this.onTogglePhotoInput,
    required this.onAddPerson,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: TextEditingController(text: newName)
                  ..selection =
                      TextSelection.collapsed(offset: newName.length),
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'Add a person, e.g. Maya',
                  isDense: true,
                ),
                onChanged: onNameChanged,
                onSubmitted: (_) => onAddPerson(),
              ),
            ),
            const SizedBox(width: 6),
            IconButton(
              icon: const Icon(Icons.image_outlined, size: 18),
              color:
                  showPhotoInput ? AppColors.primary : AppColors.textMuted,
              tooltip: 'Add photo URL',
              onPressed: onTogglePhotoInput,
            ),
            const SizedBox(width: 4),
            ElevatedButton.icon(
              onPressed: newName.trim().isEmpty ? null : onAddPerson,
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 14),
              label: const Text('Add', style: TextStyle(fontSize: 12)),
              style: ElevatedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ],
        ),
        if (showPhotoInput) ...[
          const SizedBox(height: 6),
          TextField(
            controller: TextEditingController(text: newPhoto)
              ..selection =
                  TextSelection.collapsed(offset: newPhoto.length),
            style: const TextStyle(
                fontSize: 12, color: AppColors.textPrimary),
            decoration: const InputDecoration(
              hintText: 'Photo URL (optional image link)',
              isDense: true,
            ),
            onChanged: onPhotoChanged,
          ),
        ],
        if (duplicateWarning != null) ...[
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded,
                  size: 14, color: AppColors.danger),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  duplicateWarning!,
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.danger),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
