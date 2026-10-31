/// Item-level computation and allocation math for SplitLedger.
library;

import '../../models/split_types.dart';
import '../money.dart';

/// Trim, lowercase and collapse internal whitespace so names compare consistently.
String normalizeName(String name) {
  return name.trim().toLowerCase().replaceAll(RegExp(r'\s+'), ' ');
}

/// Line total for a product row: quantity x unit price (integer paise).
int lineTotalOf(ProductItem item) {
  return item.quantity * item.unitPrice;
}

/// Signed effect of an adjustment on the bill (discounts are negative).
int computeAdjustmentAmount(Adjustment adj, int itemsTotal) {
  final raw = adj.method == AdjustmentMethod.percent
      ? ((itemsTotal * adj.value) / 100.0).round()
      : adj.value.round();
  return adj.kind == AdjustmentKind.discount ? -raw : raw;
}

/// Person ids referenced by an allocation, in bill.people order.
List<String> assignedIdsOf(ProductItem item) {
  final a = item.allocation;
  switch (a.mode) {
    case SplitMode.equal:
      return a.participantIds.where((id) => id.isNotEmpty).toList();
    case SplitMode.quantity:
      return a.quantityShares.entries
          .where((e) => e.value > 0)
          .map((e) => e.key)
          .toList();
    case SplitMode.custom:
      return a.customShares.entries
          .where((e) => e.value != 0)
          .map((e) => e.key)
          .toList();
    case SplitMode.percentage:
      return a.percentageShares.entries
          .where((e) => e.value > 0)
          .map((e) => e.key)
          .toList();
  }
}

List<String> personOrderedIds(Bill bill, Iterable<String> ids) {
  final set = ids.toSet();
  return bill.people.where((p) => set.contains(p.id)).map((p) => p.id).toList();
}

class ItemComputation {
  final int lineTotal;
  final Map<String, int> perPerson;
  final int assigned;
  final List<ValidationIssue> issues;

  const ItemComputation({
    required this.lineTotal,
    required this.perPerson,
    required this.assigned,
    required this.issues,
  });
}

/// Compute one product row's allocation. Also usable standalone by the UI to
/// preview an item assignment before saving it.
ItemComputation computeItemAllocation(Bill bill, ProductItem item) {
  final lineTotal = lineTotalOf(item);
  final allocation = item.allocation;
  final perPerson = <String, int>{};
  final issues = <ValidationIssue>[];
  int assigned = 0;

  void addAll(Iterable<MapEntry<String, int>> entries) {
    for (final entry in entries) {
      if (entry.value == 0) continue;
      perPerson[entry.key] = entry.value;
      assigned += entry.value;
    }
  }

  final itemName = item.name.trim().isEmpty ? 'Untitled product' : item.name.trim();

  switch (allocation.mode) {
    case SplitMode.equal:
      final ids = personOrderedIds(bill, allocation.participantIds);
      if (ids.isEmpty) {
        issues.add(ValidationIssue(
          code: IssueCode.itemUnassigned,
          message: '“$itemName” is not assigned to anyone yet.',
          itemId: item.id,
        ));
        break;
      }
      final parts = distributeEvenly(lineTotal, ids.length);
      addAll(ids.asMap().entries.map((e) => MapEntry(e.value, parts[e.key])));
      break;

    case SplitMode.quantity:
      final ids = personOrderedIds(bill, allocation.quantityShares.keys);
      final units = ids.map((id) => allocation.quantityShares[id] ?? 0).toList();
      final totalUnits = units.fold<int>(0, (a, b) => a + b);
      if (ids.isEmpty || totalUnits == 0) {
        issues.add(ValidationIssue(
          code: IssueCode.itemUnassigned,
          message: '“$itemName” is not assigned to anyone yet.',
          itemId: item.id,
        ));
        break;
      }
      if (units.any((u) => u < 0)) {
        issues.add(ValidationIssue(
          code: IssueCode.invalidItem,
          message: '“$itemName”: units consumed must be whole numbers.',
          itemId: item.id,
        ));
        break;
      }
      if (totalUnits != item.quantity) {
        issues.add(ValidationIssue(
          code: IssueCode.quantityMismatch,
          message:
              '“$itemName”: $totalUnits of ${item.quantity} units are assigned to people. Units consumed must add up to the quantity purchased.',
          itemId: item.id,
        ));
      }
      addAll(ids
          .where((id) => (allocation.quantityShares[id] ?? 0) > 0)
          .map((id) => MapEntry(id, allocation.quantityShares[id]! * item.unitPrice)));
      break;

    case SplitMode.custom:
      final ids = personOrderedIds(bill, allocation.customShares.keys);
      final entries = ids.map((id) => MapEntry(id, allocation.customShares[id] ?? 0)).toList();
      final sum = entries.fold<int>(0, (s, e) => s + e.value);
      if (entries.isEmpty || sum == 0) {
        issues.add(ValidationIssue(
          code: IssueCode.itemUnassigned,
          message: '“$itemName” is not assigned to anyone yet.',
          itemId: item.id,
        ));
        break;
      }
      if (entries.any((e) => e.value < 0)) {
        issues.add(ValidationIssue(
          code: IssueCode.invalidItem,
          message: '“$itemName”: custom amounts cannot be negative.',
          itemId: item.id,
        ));
        break;
      }
      if (sum != lineTotal) {
        final diff = (sum - lineTotal).abs();
        issues.add(ValidationIssue(
          code: IssueCode.customSumMismatch,
          message:
              '“$itemName”: custom amounts add up to ${formatMoney(sum, bill.currency)}, but the line total is ${formatMoney(lineTotal, bill.currency)} (off by ${formatMoney(diff, bill.currency)}).',
          itemId: item.id,
        ));
      }
      addAll(entries);
      break;

    case SplitMode.percentage:
      final ids = personOrderedIds(bill, allocation.percentageShares.keys);
      final basisPoints = ids
          .map((id) => ((allocation.percentageShares[id] ?? 0.0) * 100.0).round())
          .toList();
      final sumBp = basisPoints.fold<int>(0, (a, b) => a + b);
      if (ids.isEmpty || sumBp == 0) {
        issues.add(ValidationIssue(
          code: IssueCode.itemUnassigned,
          message: '“$itemName” is not assigned to anyone yet.',
          itemId: item.id,
        ));
        break;
      }
      if (basisPoints.any((bp) => bp < 0)) {
        issues.add(ValidationIssue(
          code: IssueCode.invalidItem,
          message: '“$itemName”: percentages cannot be negative.',
          itemId: item.id,
        ));
        break;
      }
      if (sumBp != 10000) {
        issues.add(ValidationIssue(
          code: IssueCode.percentSumMismatch,
          message:
              '“$itemName”: percentages add up to ${sumBp / 100}% — they must total exactly 100%.',
          itemId: item.id,
        ));
      }
      final parts = allocateProportionally(lineTotal, basisPoints);
      addAll(ids.asMap().entries.map((e) => MapEntry(e.value, parts[e.key])));
      break;
  }

  return ItemComputation(
    lineTotal: lineTotal,
    perPerson: perPerson,
    assigned: assigned,
    issues: issues,
  );
}

/// Remove a person from every allocation (used when deleting a participant).
Allocation allocationWithoutPerson(Allocation allocation, String personId) {
  switch (allocation.mode) {
    case SplitMode.equal:
      return Allocation.equal(
        allocation.participantIds.where((id) => id != personId).toList(),
      );
    case SplitMode.quantity:
      final shares = Map<String, int>.from(allocation.quantityShares);
      shares.remove(personId);
      return Allocation.quantity(shares);
    case SplitMode.custom:
      final shares = Map<String, int>.from(allocation.customShares);
      shares.remove(personId);
      return Allocation.custom(shares);
    case SplitMode.percentage:
      final shares = Map<String, double>.from(allocation.percentageShares);
      shares.remove(personId);
      return Allocation.percentage(shares);
  }
}
