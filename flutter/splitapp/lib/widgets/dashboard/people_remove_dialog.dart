import 'package:flutter/material.dart';
import '../../core/calculations.dart';
import '../../models/split_types.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';

void showConfirmRemovePersonDialog(
  BuildContext context, {
  required Person person,
  required BillState state,
}) {
  final assignedCount = state.bill.items
      .where((item) => assignedIdsOf(item).contains(person.id))
      .length;

  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text('Remove ${person.name}?'),
      content: Text(
        assignedCount > 0
            ? '${person.name} is assigned to $assignedCount ${assignedCount == 1 ? 'product' : 'products'}. Removing them clears their shares — you’ll need to reassign ${assignedCount == 1 ? 'that product' : 'those products'} afterwards.${person.paidAmount > 0 ? ' Their recorded payment will also be removed.' : ''}'
            : 'They are not assigned to any product. This cannot be undone.${person.paidAmount > 0 ? ' Their recorded payment will also be removed.' : ''}',
        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
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
            state.removePerson(person.id);
          },
          child: const Text('Remove person'),
        ),
      ],
    ),
  );
}
