import 'package:flutter/material.dart';
import '../../../core/calculations.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../state/bill_state.dart';
import '../../../theme/app_theme.dart';
import '../../common/smart_inputs.dart';
import 'product_assigned_badge.dart';

class ProductDesktopTable extends StatelessWidget {
  final BillState state;
  final ValueChanged<ProductItem> onOpenAssignment;
  final ValueChanged<ProductItem> onDelete;

  const ProductDesktopTable({
    super.key,
    required this.state,
    required this.onOpenAssignment,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final bill = state.bill;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 14,
        horizontalMargin: 4,
        headingRowHeight: 38,
        dataRowMinHeight: 48,
        dataRowMaxHeight: 52,
        columns: const [
          DataColumn(
              label: Text('PRODUCT',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted))),
          DataColumn(
              numeric: true,
              label: Text('QTY',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted))),
          DataColumn(
              numeric: true,
              label: Text('UNIT PRICE',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted))),
          DataColumn(
              numeric: true,
              label: Text('TOTAL',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted))),
          DataColumn(
              label: Text('ASSIGNED TO',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted))),
          DataColumn(
              label: Text('SPLIT MODE',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted))),
          DataColumn(
              numeric: true,
              label: Text('ACTIONS',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted))),
        ],
        rows: [
          ...bill.items.map((item) {
            return DataRow(
              key: ValueKey(item.id),
              cells: [
                // Product Name
                DataCell(
                  SizedBox(
                    width: 150,
                    child: TextField(
                      controller: TextEditingController(text: item.name)
                        ..selection =
                            TextSelection.collapsed(offset: item.name.length),
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textPrimary),
                      decoration: const InputDecoration(
                        hintText: 'Product name',
                        isDense: true,
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                      ),
                      onChanged: (val) => state.updateItem(item.id, name: val),
                    ),
                  ),
                ),
                // Quantity
                DataCell(
                  IntInputField(
                    width: 60,
                    value: item.quantity,
                    min: 1,
                    onCommit: (val) =>
                        state.updateItem(item.id, quantity: val),
                  ),
                ),
                // Unit Price
                DataCell(
                  MoneyInputField(
                    width: 90,
                    value: item.unitPrice,
                    onCommit: (val) =>
                        state.updateItem(item.id, unitPrice: val),
                  ),
                ),
                // Line Total
                DataCell(
                  Text(
                    formatMoney(lineTotalOf(item), bill.currency),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'monospace',
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                // Assigned To
                DataCell(
                  ProductAssignedBadge(
                    item: item,
                    bill: bill,
                    onTap: () => onOpenAssignment(item),
                  ),
                ),
                // Split Mode
                DataCell(
                  InkWell(
                    onTap: () => onOpenAssignment(item),
                    borderRadius: BorderRadius.circular(6),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 4),
                      child: Text(
                        item.allocation.mode.label,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ),
                  ),
                ),
                // Actions
                DataCell(
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, size: 16),
                        color: AppColors.textMuted,
                        onPressed: () => onOpenAssignment(item),
                        tooltip: 'Edit assignment',
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy_rounded, size: 16),
                        color: AppColors.textMuted,
                        onPressed: () => state.duplicateItem(item.id),
                        tooltip: 'Duplicate product',
                      ),
                      IconButton(
                        icon:
                            const Icon(Icons.delete_outline_rounded, size: 16),
                        color: AppColors.textMuted,
                        hoverColor: AppColors.dangerSubtle,
                        onPressed: () => onDelete(item),
                        tooltip: 'Delete product',
                      ),
                    ],
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }
}
