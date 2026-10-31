import 'package:flutter/material.dart';
import '../../core/id.dart';
import '../../models/split_types.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import '../dialogs/allocation_dialog.dart';
import 'products/product_adjustments_section.dart';
import 'products/product_desktop_table.dart';
import 'products/product_mobile_card.dart';

export 'products/product_adjustments_section.dart';
export 'products/product_assigned_badge.dart';
export 'products/product_desktop_table.dart';
export 'products/product_mobile_card.dart';

class ProductsTable extends StatelessWidget {
  final BillState state;
  final VoidCallback onOpenVision;

  const ProductsTable({
    super.key,
    required this.state,
    required this.onOpenVision,
  });

  void _openAssignment(BuildContext context, ProductItem item) {
    showDialog(
      context: context,
      builder: (ctx) => AllocationDialog(
        item: item,
        bill: state.bill,
        onSave: (newAlloc) => state.setAllocation(item.id, newAlloc),
      ),
    );
  }

  void _confirmDelete(BuildContext context, ProductItem item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
            'Delete “${item.name.trim().isEmpty ? 'Untitled product' : item.name}”?'),
        content: const Text(
          'This removes the product and its assignment. This cannot be undone.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          OutlinedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style:
                ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () {
              Navigator.of(ctx).pop();
              state.removeItem(item.id);
            },
            child: const Text('Delete product'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bill = state.bill;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          LayoutBuilder(
            builder: (ctx, headerConstraints) {
              final isNarrow = headerConstraints.maxWidth < 500;
              final titleSection = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Products & prices',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Enter every item first — totals update as you type.',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              );

              final buttonsSection = Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  OutlinedButton.icon(
                    onPressed: onOpenVision,
                    icon: const Icon(Icons.auto_awesome,
                        size: 14, color: AppColors.primaryLight),
                    label: const Text(
                      'AI Scan / Describe',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.primaryLight),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.3)),
                      backgroundColor: AppColors.primarySubtle,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () {
                      state.addItem(ProductItem(
                        id: newId('item'),
                        name: '',
                        quantity: 1,
                        unitPrice: 0,
                        allocation: Allocation.equal(const []),
                      ));
                    },
                    icon: const Icon(Icons.add, size: 14),
                    label: const Text('Add Product',
                        style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                    ),
                  ),
                ],
              );

              if (isNarrow) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    titleSection,
                    const SizedBox(height: 10),
                    buttonsSection,
                  ],
                );
              }

              return Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(child: titleSection),
                  buttonsSection,
                ],
              );
            },
          ),
          const SizedBox(height: 16),

          // Content: Empty State or Table
          if (bill.items.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: AppColors.border, style: BorderStyle.solid),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.receipt_long_rounded,
                      size: 40, color: AppColors.textMuted),
                  const SizedBox(height: 8),
                  const Text(
                    'No products yet',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Add the first item from your bill — name, quantity and unit price. You can assign people to each product afterwards.',
                    textAlign: TextAlign.center,
                    style:
                        TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: onOpenVision,
                    icon: const Icon(Icons.auto_awesome,
                        size: 14, color: AppColors.primaryLight),
                    label: const Text('Upload Bill / Describe Image',
                        style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
            )
          else ...[
            LayoutBuilder(builder: (context, constraints) {
              final isWide = constraints.maxWidth >= 640;
              return isWide
                  ? ProductDesktopTable(
                      state: state,
                      onOpenAssignment: (it) => _openAssignment(context, it),
                      onDelete: (it) => _confirmDelete(context, it),
                    )
                  : Column(
                      children: bill.items.map((it) {
                        return ProductMobileCard(
                          item: it,
                          state: state,
                          onOpenAssignment: () =>
                              _openAssignment(context, it),
                          onDuplicate: () => state.duplicateItem(it.id),
                          onDelete: () => _confirmDelete(context, it),
                        );
                      }).toList(),
                    );
            }),
          ],

          const SizedBox(height: 20),
          const Divider(),
          const SizedBox(height: 16),

          // Bill-Level Adjustments
          ProductAdjustmentsSection(state: state),
        ],
      ),
    );
  }
}
