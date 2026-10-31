import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';
import '../../common/person_avatar.dart';
import 'vision_dialog_models.dart';
import 'vision_item_assignment_sheet.dart';

class VisionProductRowTile extends StatelessWidget {
  final EditableDetectedItem item;
  final List<DialogPerson> people;
  final ValueChanged<EditableDetectedItem> onUpdate;
  final VoidCallback onRemove;

  const VisionProductRowTile({
    super.key,
    required this.item,
    required this.people,
    required this.onUpdate,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final assigned = people.where((p) => item.assignedParticipantIds.contains(p.id)).toList();

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  initialValue: item.name,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                  decoration: const InputDecoration(
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (val) => onUpdate(item.copyWith(name: val)),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: onRemove,
                icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.coralRed),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove, size: 14),
                      padding: const EdgeInsets.all(4),
                      constraints: const BoxConstraints(),
                      onPressed: item.quantity > 1
                          ? () {
                              final newQty = item.quantity - 1;
                              onUpdate(item.copyWith(quantity: newQty, totalPaise: newQty * item.unitPricePaise));
                            }
                          : null,
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text('${item.quantity}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add, size: 14),
                      padding: const EdgeInsets.all(4),
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        final newQty = item.quantity + 1;
                        onUpdate(item.copyWith(quantity: newQty, totalPaise: newQty * item.unitPricePaise));
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextFormField(
                  initialValue: (item.unitPricePaise / 100).toStringAsFixed(2),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(fontSize: 12, color: Colors.white, fontFamily: 'monospace'),
                  decoration: const InputDecoration(
                    prefixText: '₹ ',
                    labelText: 'Unit Price',
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (val) {
                    final d = double.tryParse(val) ?? 0.0;
                    final paise = (d * 100).round();
                    onUpdate(item.copyWith(unitPricePaise: paise, totalPaise: item.quantity * paise));
                  },
                ),
              ),
              const SizedBox(width: 8),
              Text(
                formatMoney(item.totalPaise, CurrencyCode.inr),
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mintSage, fontFamily: 'monospace'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => VisionItemAssignmentSheet.show(
              context: context,
              item: item,
              people: people,
              onAssignedChanged: (ids) => onUpdate(item.copyWith(assignedParticipantIds: ids)),
            ),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: assigned.isEmpty ? AppColors.honeyAmber.withValues(alpha: 0.4) : AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.people_outline, size: 14, color: AppColors.textMuted),
                  const SizedBox(width: 6),
                  if (assigned.isEmpty)
                    const Expanded(
                      child: Text(
                        'Not assigned · Tap to select',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, color: AppColors.honeyAmber, fontWeight: FontWeight.w600),
                      ),
                    )
                  else
                    Expanded(
                      child: Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          ...assigned.take(3).map((p) => Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  PersonAvatar(name: p.name, photo: p.photo, size: AvatarSize.xs),
                                  const SizedBox(width: 3),
                                  Text(p.name, style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500)),
                                ],
                              )),
                          if (assigned.length > 3)
                            Text('+${assigned.length - 3} more', style: const TextStyle(fontSize: 10, color: AppColors.mintSage, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right, size: 14, color: AppColors.textMuted),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
