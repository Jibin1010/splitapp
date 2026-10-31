import '../../../core/id.dart';
import '../../../models/split_types.dart';
import '../../../models/vision_types.dart';
import '../../../state/bill_state.dart';

void importVisionItemsToBill({
  required BillState state,
  required List<DetectedBillItem> itemsList,
  required VisionApiResponse? result,
  required bool applyTax,
}) {
  if (itemsList.isEmpty) return;

  for (final item in itemsList) {
    if (item.name.trim().isEmpty) continue;
    state.addItem(ProductItem(
      id: newId('item'),
      name: item.name.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPricePaise,
      allocation: Allocation.equal(const []),
    ));
  }

  if (applyTax && (result?.taxPaise ?? 0) > 0) {
    final computedSubtotal = itemsList.fold<int>(0, (s, i) => s + i.totalPaise);
    final subtotal =
        (result?.subtotalPaise ?? 0) > 0 ? result!.subtotalPaise! : computedSubtotal;

    if (result != null && (result.cgstPaise ?? 0) > 0 && (result.sgstPaise ?? 0) > 0 && subtotal > 0) {
      final cgstPercent = ((result.cgstPaise! / subtotal) * 1000).round() / 10.0;
      final sgstPercent = ((result.sgstPaise! / subtotal) * 1000).round() / 10.0;
      state.addAdjustment(Adjustment(
        id: newId('adj'),
        label: 'CGST ($cgstPercent%)',
        kind: AdjustmentKind.tax,
        method: AdjustmentMethod.percent,
        value: cgstPercent,
      ));
      state.addAdjustment(Adjustment(
        id: newId('adj'),
        label: 'SGST ($sgstPercent%)',
        kind: AdjustmentKind.tax,
        method: AdjustmentMethod.percent,
        value: sgstPercent,
      ));
    } else if (result != null && subtotal > 0 && (result.taxPaise ?? 0) > 0) {
      final taxPercent = ((result.taxPaise! / subtotal) * 1000).round() / 10.0;
      state.addAdjustment(Adjustment(
        id: newId('adj'),
        label: 'GST ($taxPercent%)',
        kind: AdjustmentKind.tax,
        method: AdjustmentMethod.percent,
        value: taxPercent,
      ));
    } else if (result != null && (result.taxPaise ?? 0) > 0) {
      state.addAdjustment(Adjustment(
        id: newId('adj'),
        label: 'Receipt Tax',
        kind: AdjustmentKind.tax,
        method: AdjustmentMethod.fixed,
        value: result.taxPaise!.toDouble(),
      ));
    }
  }
}
