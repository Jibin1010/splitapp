import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../common/person_avatar.dart';
import 'vision_dialog_models.dart';

class VisionItemAssignmentSheet extends StatefulWidget {
  final EditableDetectedItem item;
  final List<DialogPerson> people;
  final ValueChanged<List<String>> onAssignedChanged;

  const VisionItemAssignmentSheet({
    super.key,
    required this.item,
    required this.people,
    required this.onAssignedChanged,
  });

  static Future<void> show({
    required BuildContext context,
    required EditableDetectedItem item,
    required List<DialogPerson> people,
    required ValueChanged<List<String>> onAssignedChanged,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => VisionItemAssignmentSheet(
        item: item,
        people: people,
        onAssignedChanged: onAssignedChanged,
      ),
    );
  }

  @override
  State<VisionItemAssignmentSheet> createState() =>
      _VisionItemAssignmentSheetState();
}

class _VisionItemAssignmentSheetState extends State<VisionItemAssignmentSheet> {
  late Set<String> _selectedIds;

  @override
  void initState() {
    super.initState();
    _selectedIds = widget.item.assignedParticipantIds.toSet();
  }

  void _toggle(String personId) {
    setState(() {
      if (_selectedIds.contains(personId)) {
        _selectedIds.remove(personId);
      } else {
        _selectedIds.add(personId);
      }
    });
    widget.onAssignedChanged(_selectedIds.toList());
  }

  void _selectAll() {
    setState(() {
      _selectedIds = widget.people.map((p) => p.id).toSet();
    });
    widget.onAssignedChanged(_selectedIds.toList());
  }

  void _clearAll() {
    setState(() {
      _selectedIds.clear();
    });
    widget.onAssignedChanged([]);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Assign Participants',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.item.name,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.mintSage,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  TextButton(
                    onPressed: _selectAll,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text('All', style: TextStyle(fontSize: 12, color: AppColors.mintSage)),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: _clearAll,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text('Clear', style: TextStyle(fontSize: 12, color: AppColors.coralRed)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 320),
            child: widget.people.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'No participants added yet. Add people in Step 1 first.',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: widget.people.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (ctx, idx) {
                      final p = widget.people[idx];
                      final isSelected = _selectedIds.contains(p.id);

                      return InkWell(
                        onTap: () => _toggle(p.id),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.surfaceElevated : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? AppColors.mintSage.withValues(alpha: 0.5) : AppColors.border,
                            ),
                          ),
                          child: Row(
                            children: [
                              PersonAvatar(name: p.name, photo: p.photo, size: AvatarSize.sm),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  p.name,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    color: isSelected ? Colors.white : AppColors.textSecondary,
                                  ),
                                ),
                              ),
                              Icon(
                                isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                color: isSelected ? AppColors.mintSage : AppColors.textMuted,
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.mintSage,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: Text(
              'Done (${_selectedIds.length} assigned)',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
        ],
      ),
    ),
  );
  }
}
