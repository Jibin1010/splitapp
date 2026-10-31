import 'package:flutter/material.dart';
import '../../core/id.dart';
import '../../models/split_types.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';

void showQuickActionsSheet({
  required BuildContext context,
  required BillState state,
  required VoidCallback onOpenVision,
  required ValueChanged<int> onSwitchTab,
}) {
  showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (ctx) => SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'QUICK ACTIONS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.coral.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.camera_alt_rounded,
                    color: AppColors.coral),
              ),
              title: const Text('Scan Bill / Receipt with AI Vision',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: const Text('Extract exact items, quantities & tax',
                  style:
                      TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              onTap: () {
                Navigator.of(ctx).pop();
                onOpenVision();
              },
            ),
            ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.electricIris.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.add_shopping_cart_rounded,
                    color: AppColors.electricIris),
              ),
              title: const Text('Add Product Item',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: const Text('Enter name, quantity and price',
                  style:
                      TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              onTap: () {
                Navigator.of(ctx).pop();
                onSwitchTab(2);
                state.addItem(
                  ProductItem(
                    id: newId('item'),
                    name: 'New Item',
                    quantity: 1,
                    unitPrice: 15000,
                    allocation: Allocation.equal(
                      state.bill.people.map((p) => p.id).toList(),
                    ),
                  ),
                );
              },
            ),
            ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.honeyYellow.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.person_add_rounded,
                    color: AppColors.honeyYellow),
              ),
              title: const Text('Add Participant / Head Payer',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: const Text('Include a friend or front payer',
                  style:
                      TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              onTap: () {
                Navigator.of(ctx).pop();
                onSwitchTab(2);
                state.addPerson(
                    'Participant ${state.bill.people.length + 1}');
              },
            ),
            ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.mintSage.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.auto_fix_high_rounded,
                    color: AppColors.mintSage),
              ),
              title: const Text('Auto-Balance Head Payers',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: const Text(
                  'Automatically reconcile paid amounts with total bill',
                  style:
                      TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              onTap: () {
                Navigator.of(ctx).pop();
                state.autoBalanceToFirstPerson();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Head payers balanced successfully!'),
                      backgroundColor: AppColors.mintSage),
                );
              },
            ),
          ],
        ),
      ),
    ),
  );
}
