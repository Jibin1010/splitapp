import 'package:flutter/material.dart';
import '../../../core/calculations.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../state/bill_state.dart';
import '../../../theme/app_theme.dart';
import '../../common/smart_inputs.dart';
import 'product_assigned_badge.dart';

class ProductMobileCard extends StatelessWidget {
  final ProductItem item;
  final BillState state;
  final VoidCallback onOpenAssignment;
  final VoidCallback onDuplicate;
  final VoidCallback onDelete;

  const ProductMobileCard({
    super.key,
    required this.item,
    required this.state,
    required this.onOpenAssignment,
    required this.onDuplicate,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final bill = state.bill;
    final active = state.activePerson;
    final userShare =
        active != null ? state.getItemShareForActivePerson(item.id) : 0;
    final isUserAssigned = userShare > 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isUserAssigned
            ? AppColors.surfaceElevated
            : AppColors.surfaceElevated.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isUserAssigned ? AppColors.electricIris : AppColors.border,
          width: isUserAssigned ? 1.8 : 1.0,
        ),
        boxShadow: isUserAssigned
            ? [
                BoxShadow(
                  color: AppColors.electricIris.withValues(alpha: 0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                )
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Active user share spotlight banner
          if (active != null) ...[
            if (isUserAssigned)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.electricIris.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: AppColors.electricIris.withValues(alpha: 0.5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.auto_awesome_rounded,
                        size: 13, color: AppColors.electricIris),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        '${active.name}’s portion',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      formatMoney(userShare, bill.currency),
                      style: const TextStyle(
                        color: AppColors.mintSage,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  '• Not included in ${active.name}’s share',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 10,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
          ],
          TextField(
            controller: TextEditingController(text: item.name)
              ..selection =
                  TextSelection.collapsed(offset: item.name.length),
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary),
            decoration: const InputDecoration(
              hintText: 'Product name',
              isDense: true,
              contentPadding:
                  EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            ),
            onChanged: (val) => state.updateItem(item.id, name: val),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('QTY',
                        style: TextStyle(
                            fontSize: 10, color: AppColors.textMuted)),
                    const SizedBox(height: 2),
                    IntInputField(
                      value: item.quantity,
                      min: 1,
                      onCommit: (val) =>
                          state.updateItem(item.id, quantity: val),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('UNIT PRICE',
                        style: TextStyle(
                            fontSize: 10, color: AppColors.textMuted)),
                    const SizedBox(height: 2),
                    MoneyInputField(
                      value: item.unitPrice,
                      onCommit: (val) =>
                          state.updateItem(item.id, unitPrice: val),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Line total',
                  style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
              Text(
                formatMoney(lineTotalOf(item), bill.currency),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'monospace',
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: ProductAssignedBadge(
                  item: item,
                  bill: bill,
                  onTap: onOpenAssignment,
                ),
              ),
              const SizedBox(width: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    padding: const EdgeInsets.all(4),
                    constraints:
                        const BoxConstraints(minWidth: 28, minHeight: 28),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    color: AppColors.textMuted,
                    onPressed: onOpenAssignment,
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    padding: const EdgeInsets.all(4),
                    constraints:
                        const BoxConstraints(minWidth: 28, minHeight: 28),
                    icon: const Icon(Icons.copy_rounded, size: 16),
                    color: AppColors.textMuted,
                    onPressed: onDuplicate,
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    padding: const EdgeInsets.all(4),
                    constraints:
                        const BoxConstraints(minWidth: 28, minHeight: 28),
                    icon: const Icon(Icons.delete_outline_rounded, size: 16),
                    color: AppColors.textMuted,
                    onPressed: onDelete,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
