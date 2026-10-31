import 'package:flutter/material.dart';
import '../../../core/calculations.dart';
import '../../../core/id.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../state/bill_state.dart';
import '../../../theme/app_theme.dart';
import '../../common/smart_inputs.dart';

class ProductAdjustmentsSection extends StatelessWidget {
  final BillState state;

  const ProductAdjustmentsSection({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final bill = state.bill;
    final totals = billTotalsOf(bill);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Adjustments (optional)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Service charge, tax or discount — applied to the items subtotal and split proportionally.',
                    style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            OutlinedButton.icon(
              onPressed: () {
                state.addAdjustment(Adjustment(
                  id: newId('adj'),
                  label: 'Service charge',
                  kind: AdjustmentKind.serviceCharge,
                  method: AdjustmentMethod.percent,
                  value: 10,
                ));
              },
              icon: const Icon(Icons.add, size: 12),
              label:
                  const Text('Add adjustment', style: TextStyle(fontSize: 11)),
              style: OutlinedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
            ),
          ],
        ),
        if (bill.adjustments.isNotEmpty) ...[
          const SizedBox(height: 12),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: bill.adjustments.length,
            separatorBuilder: (ctx, i) => const SizedBox(height: 8),
            itemBuilder: (ctx, index) {
              final adj = bill.adjustments[index];
              final amt = computeAdjustmentAmount(adj, totals.itemsTotal);
              final isDiscount = amt < 0;

              return Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    // Label
                    Expanded(
                      flex: 3,
                      child: TextField(
                        controller: TextEditingController(text: adj.label)
                          ..selection = TextSelection.collapsed(
                              offset: adj.label.length),
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 8, vertical: 6),
                        ),
                        onChanged: (val) =>
                            state.updateAdjustment(adj.id, label: val),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Kind Dropdown
                    Container(
                      height: 32,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<AdjustmentKind>(
                          value: adj.kind,
                          isDense: true,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textPrimary),
                          dropdownColor: AppColors.surfaceElevated,
                          items: AdjustmentKind.values.map((k) {
                            return DropdownMenuItem(
                                value: k, child: Text(k.label));
                          }).toList(),
                          onChanged: (k) {
                            if (k != null) {
                              state.updateAdjustment(adj.id, kind: k);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Method Dropdown
                    Container(
                      height: 32,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<AdjustmentMethod>(
                          value: adj.method,
                          isDense: true,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textPrimary),
                          dropdownColor: AppColors.surfaceElevated,
                          items: AdjustmentMethod.values.map((m) {
                            return DropdownMenuItem(
                                value: m, child: Text(m.label));
                          }).toList(),
                          onChanged: (m) {
                            if (m != null) {
                              state.updateAdjustment(
                                adj.id,
                                method: m,
                                value: m == AdjustmentMethod.percent
                                    ? 10.0
                                    : 0.0,
                              );
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Value Input
                    if (adj.method == AdjustmentMethod.percent)
                      FloatInputField(
                        width: 80,
                        value: adj.value,
                        min: 0,
                        max: 100,
                        suffix: '%',
                        onCommit: (val) =>
                            state.updateAdjustment(adj.id, value: val),
                      )
                    else
                      MoneyInputField(
                        width: 90,
                        value: adj.value.round(),
                        onCommit: (val) => state.updateAdjustment(adj.id,
                            value: val.toDouble()),
                      ),
                    const SizedBox(width: 10),

                    // Computed Amount
                    SizedBox(
                      width: 90,
                      child: Text(
                        formatMoney(amt, bill.currency),
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'monospace',
                          color: isDiscount
                              ? AppColors.success
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),

                    // Remove
                    IconButton(
                      icon: const Icon(Icons.delete_outline_rounded,
                          size: 16),
                      color: AppColors.textMuted,
                      hoverColor: AppColors.dangerSubtle,
                      onPressed: () => state.removeAdjustment(adj.id),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              const Text(
                'Adjustments total: ',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              Text(
                formatMoney(totals.adjustmentsTotal, bill.currency),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'monospace',
                  color: totals.adjustmentsTotal < 0
                      ? AppColors.success
                      : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
