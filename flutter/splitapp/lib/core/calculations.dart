/// Calculation engine for validating bills, allocating items and computing totals.
library;

import '../models/split_types.dart';
import 'money.dart';
import 'calculations/item_allocation.dart';
import 'calculations/settlement_engine.dart';

export 'calculations/item_allocation.dart';
export 'calculations/settlement_engine.dart';

class BillTotals {
  final int itemsTotal;
  final int adjustmentsTotal;
  final int billTotal;
  const BillTotals({
    required this.itemsTotal,
    required this.adjustmentsTotal,
    required this.billTotal,
  });
}

/// Convenience for summary cards: quick totals without running full settlements.
BillTotals billTotalsOf(Bill bill) {
  int itemsTotal = 0;
  for (final item in bill.items) {
    itemsTotal += lineTotalOf(item);
  }
  int adjustmentsTotal = 0;
  for (final adj in bill.adjustments) {
    adjustmentsTotal += computeAdjustmentAmount(adj, itemsTotal);
  }
  return BillTotals(
    itemsTotal: itemsTotal,
    adjustmentsTotal: adjustmentsTotal,
    billTotal: itemsTotal + adjustmentsTotal,
  );
}

/// Validate the bill and compute all shares, totals and settlements.
CalculationResult calculateBill(Bill bill) {
  final issues = <ValidationIssue>[];
  final currency = bill.currency;
  String fmt(int p) => formatMoney(p, currency);

  final itemAllocations = <String, Map<String, int>>{};
  int itemsTotal = 0;
  int unassignedValue = 0;

  if (bill.items.isEmpty) {
    issues.add(const ValidationIssue(
      code: IssueCode.emptyBill,
      message: 'Add at least one product before calculating.',
    ));
  }
  if (bill.people.isEmpty) {
    issues.add(const ValidationIssue(
      code: IssueCode.noPeople,
      message: 'Add at least one person before calculating.',
    ));
  }

  // Duplicate / empty person names check.
  final nameCounts = <String, int>{};
  for (final person in bill.people) {
    final name = person.name.trim();
    if (name.isEmpty) {
      issues.add(ValidationIssue(
        code: IssueCode.invalidPerson,
        message: 'Every person needs a name.',
        personId: person.id,
      ));
      continue;
    }
    final key = normalizeName(name);
    if (nameCounts.containsKey(key)) {
      issues.add(ValidationIssue(
        code: IssueCode.duplicateName,
        message:
            '“$name” is already a participant. Names must be unique (differences in spacing or capitalization don’t count).',
        personId: person.id,
      ));
    } else {
      nameCounts[key] = 1;
    }
  }

  // Items: structural validation + per-item allocation.
  for (final item in bill.items) {
    final lineTotal = lineTotalOf(item);
    if (item.name.trim().isEmpty) {
      issues.add(ValidationIssue(
        code: IssueCode.invalidItem,
        message: 'Every product needs a name.',
        itemId: item.id,
      ));
    }
    if (item.quantity < 1 || item.quantity > 1000000) {
      issues.add(ValidationIssue(
        code: IssueCode.invalidItem,
        message: '“${item.name.trim().isEmpty ? 'Untitled product' : item.name.trim()}” has an invalid quantity.',
        itemId: item.id,
      ));
    }
    if (item.unitPrice < 0 || item.unitPrice > 1000000000) {
      issues.add(ValidationIssue(
        code: IssueCode.invalidItem,
        message: '“${item.name.trim().isEmpty ? 'Untitled product' : item.name.trim()}” has an invalid unit price.',
        itemId: item.id,
      ));
    }
    itemsTotal += lineTotal;

    final computed = computeItemAllocation(bill, item);
    itemAllocations[item.id] = computed.perPerson;
    issues.addAll(computed.issues);
    final missing = computed.lineTotal - computed.assigned;
    if (missing > 0) unassignedValue += missing;
  }

  // Item share totals per person (used as weights for adjustments).
  final shareTotals = <String, int>{};
  for (final person in bill.people) {
    int share = 0;
    for (final item in bill.items) {
      final amount = itemAllocations[item.id]?[person.id];
      if (amount != null) share += amount;
    }
    shareTotals[person.id] = share;
  }
  final shareSum = bill.people.fold<int>(0, (s, p) => s + (shareTotals[p.id] ?? 0));

  // Bill-level adjustments, allocated proportionally to each person's item share.
  final adjustmentAllocations = <String, Map<String, int>>{};
  int adjustmentsTotal = 0;
  for (final adj in bill.adjustments) {
    final label = adj.label.trim().isEmpty ? 'Adjustment' : adj.label.trim();
    if (adj.method == AdjustmentMethod.percent &&
        (!adj.value.isFinite || adj.value <= 0 || adj.value > 100)) {
      issues.add(ValidationIssue(
        code: IssueCode.invalidAdjustment,
        message: '“$label”: percentage adjustments must be between 0 and 100.',
        adjustmentId: adj.id,
      ));
      continue;
    }
    if (adj.method == AdjustmentMethod.fixed && adj.value < 0) {
      issues.add(ValidationIssue(
        code: IssueCode.invalidAdjustment,
        message: '“$label”: fixed amounts must be zero or more.',
        adjustmentId: adj.id,
      ));
      continue;
    }
    final amount = computeAdjustmentAmount(adj, itemsTotal);
    adjustmentsTotal += amount;

    final allocation = <String, int>{};
    if (adj.shares != null && adj.shares!.isNotEmpty && bill.people.isNotEmpty) {
      final weights = bill.people
          .map((p) => ((adj.shares![p.id] ?? 0) * 100).round())
          .toList();
      final totalWeight = weights.fold<int>(0, (s, w) => s + w);
      if (totalWeight > 0) {
        final parts = allocateProportionally(amount.abs(), weights);
        for (int i = 0; i < bill.people.length; i++) {
          final p = bill.people[i];
          allocation[p.id] = amount < 0 ? -parts[i] : parts[i];
        }
      } else {
        for (final p in bill.people) {
          allocation[p.id] = 0;
        }
      }
    } else if (shareSum > 0) {
      final weights = bill.people.map((p) => shareTotals[p.id] ?? 0).toList();
      final parts = allocateProportionally(amount.abs(), weights);
      for (int i = 0; i < bill.people.length; i++) {
        final p = bill.people[i];
        allocation[p.id] = amount < 0 ? -parts[i] : parts[i];
      }
    } else {
      for (final p in bill.people) {
        allocation[p.id] = 0;
      }
    }
    adjustmentAllocations[adj.id] = allocation;
  }

  final billTotal = itemsTotal + adjustmentsTotal;
  if (billTotal < 0) {
    issues.add(const ValidationIssue(
      code: IssueCode.negativeTotal,
      message: 'Discounts exceed the bill subtotal.',
    ));
  }

  // Per-person results.
  final people = <String, PersonResult>{};
  int paidTotal = 0;
  for (final person in bill.people) {
    final itemContributions = <String, int>{};
    int share = 0;
    for (final item in bill.items) {
      final amount = itemAllocations[item.id]?[person.id];
      if (amount != null && amount > 0) {
        itemContributions[item.id] = amount;
        share += amount;
      }
    }
    for (final adj in bill.adjustments) {
      final amount = adjustmentAllocations[adj.id]?[person.id];
      if (amount != null && amount != 0) {
        share += amount;
      }
    }
    if (person.paidAmount < 0) {
      issues.add(ValidationIssue(
        code: IssueCode.invalidPerson,
        message: '“${person.name.trim().isEmpty ? 'Unnamed person' : person.name.trim()}” has an invalid paid amount.',
        personId: person.id,
      ));
    }
    final paid = person.paidAmount >= 0 ? person.paidAmount : 0;
    paidTotal += paid;
    people[person.id] = PersonResult(
      personId: person.id,
      share: share,
      paid: paid,
      net: paid - share,
      itemContributions: itemContributions,
    );
  }

  // Payer reconciliation: total paid must equal the bill total.
  if (bill.items.isNotEmpty && bill.people.isNotEmpty && paidTotal != billTotal) {
    final diff = (billTotal - paidTotal).abs();
    issues.add(ValidationIssue(
      code: IssueCode.paidTotalMismatch,
      message: paidTotal == 0
          ? 'Record who paid the bill — nothing has been marked as paid yet (bill total ${fmt(billTotal)}).'
          : 'The amount marked as paid (${fmt(paidTotal)}) doesn’t match the bill total (${fmt(billTotal)}). Difference: ${fmt(diff)}.',
    ));
  }

  final valid = issues.isEmpty;
  final bool hasCreditorsAndDebtors =
      people.values.any((p) => p.net > 0) && people.values.any((p) => p.net < 0);
  final settlements = (valid || hasCreditorsAndDebtors)
      ? computeSettlements(people, bill.people)
      : <Settlement>[];

  return CalculationResult(
    valid: valid,
    issues: issues,
    itemsTotal: itemsTotal,
    adjustmentsTotal: adjustmentsTotal,
    billTotal: billTotal,
    unassignedValue: unassignedValue,
    itemAllocations: itemAllocations,
    adjustmentAllocations: adjustmentAllocations,
    people: people,
    settlements: settlements,
  );
}
