import 'package:flutter/material.dart';
import '../../../core/id.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';
import 'vision_dialog_models.dart';
import 'vision_product_row_tile.dart';

export 'vision_product_row_tile.dart';

class VisionProductsTable extends StatelessWidget {
  final List<EditableDetectedItem> items;
  final List<DialogPerson> people;
  final ValueChanged<List<EditableDetectedItem>> onChangedItems;

  const VisionProductsTable({
    super.key,
    required this.items,
    required this.people,
    required this.onChangedItems,
  });

  void _updateItem(int index, EditableDetectedItem updated) {
    final list = List<EditableDetectedItem>.from(items);
    list[index] = updated;
    onChangedItems(list);
  }

  void _removeItem(int index) {
    final list = List<EditableDetectedItem>.from(items)..removeAt(index);
    onChangedItems(list);
  }

  void _addItem() {
    final newItem = EditableDetectedItem(
      id: newId('item'),
      name: 'New Product',
      quantity: 1,
      unitPricePaise: 10000,
      totalPaise: 10000,
      assignedParticipantIds: people.map((p) => p.id).toList(),
    );
    onChangedItems([...items, newItem]);
  }

  void _assignAllToEveryone() {
    final allIds = people.map((p) => p.id).toList();
    final updated = items.map((i) => i.copyWith(assignedParticipantIds: allIds)).toList();
    onChangedItems(updated);
  }

  @override
  Widget build(BuildContext context) {
    final totalPaise = items.fold<int>(0, (acc, item) => acc + item.totalPaise);
    final totalQty = items.fold<int>(0, (acc, item) => acc + item.quantity);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 6,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: AppColors.honeyAmber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: const Text('2', style: TextStyle(color: AppColors.honeyAmber, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Products (${items.length}) & Assignment',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  OutlinedButton.icon(
                    onPressed: people.isEmpty ? null : _assignAllToEveryone,
                    icon: const Icon(Icons.group_add_rounded, size: 12),
                    label: const Text('Assign all', style: TextStyle(fontSize: 11)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.mintSage,
                      side: const BorderSide(color: AppColors.mintSage),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: _addItem,
                    icon: const Icon(Icons.add, size: 12),
                    label: const Text('Add Item', style: TextStyle(fontSize: 11)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.honeyAmber,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (items.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              alignment: Alignment.center,
              child: const Text('No products extracted. Tap "+ Add Item" to create one.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = items[index];
                return VisionProductRowTile(
                  key: ValueKey(item.id),
                  item: item,
                  people: people,
                  onUpdate: (updated) => _updateItem(index, updated),
                  onRemove: () => _removeItem(index),
                );
              },
            ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Subtotal ($totalQty items)', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                Text(formatMoney(totalPaise, CurrencyCode.inr), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'monospace')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
