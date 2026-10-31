import 'package:flutter/material.dart';
import '../../../core/calculations.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';

mixin AllocationControllerMixin<T extends StatefulWidget> on State<T> {
  ProductItem get item;
  Bill get bill;

  late SplitMode mode;
  late Set<String> selected;
  late Map<String, String> entries;
  String search = '';

  void initAllocationState() {
    final allocation = item.allocation;
    mode = allocation.mode;
    selected = <String>{};
    entries = <String, String>{};

    if (allocation.mode == SplitMode.equal) {
      selected.addAll(allocation.participantIds);
    } else if (allocation.mode == SplitMode.quantity) {
      for (final entry in allocation.quantityShares.entries) {
        if (entry.value > 0) {
          selected.add(entry.key);
          entries[entry.key] = entry.value.toString();
        }
      }
    } else if (allocation.mode == SplitMode.custom) {
      for (final entry in allocation.customShares.entries) {
        if (entry.value > 0) {
          selected.add(entry.key);
          entries[entry.key] = amountToInputString(entry.value);
        }
      }
    } else if (allocation.mode == SplitMode.percentage) {
      for (final entry in allocation.percentageShares.entries) {
        if (entry.value > 0) {
          selected.add(entry.key);
          entries[entry.key] = entry.value.toStringAsFixed(2);
        }
      }
    }
  }

  List<String> get selectedIds {
    return bill.people
        .where((p) => selected.contains(p.id))
        .map((p) => p.id)
        .toList();
  }

  Allocation get draftAllocation {
    switch (mode) {
      case SplitMode.equal:
        return Allocation.equal(selectedIds);
      case SplitMode.quantity:
        final shares = <String, int>{};
        for (final id in selectedIds) {
          final units = int.tryParse(entries[id] ?? '') ?? 0;
          if (units > 0) shares[id] = units;
        }
        return Allocation.quantity(shares);
      case SplitMode.custom:
        final shares = <String, int>{};
        for (final id in selectedIds) {
          final paise = parseAmount(entries[id] ?? '') ?? 0;
          if (paise > 0) shares[id] = paise;
        }
        return Allocation.custom(shares);
      case SplitMode.percentage:
        final shares = <String, double>{};
        for (final id in selectedIds) {
          final pct = double.tryParse(entries[id] ?? '') ?? 0.0;
          if (pct > 0) shares[id] = pct;
        }
        return Allocation.percentage(shares);
    }
  }

  void togglePerson(String personId, bool on) {
    setState(() {
      if (on) {
        selected.add(personId);
        if (!entries.containsKey(personId)) {
          final lineTotal = lineTotalOf(item);
          if (mode == SplitMode.quantity) {
            entries[personId] = '1';
          } else if (mode == SplitMode.custom) {
            final sumOthers = selectedIds
                .where((id) => id != personId)
                .fold<int>(
                    0, (s, id) => s + (parseAmount(entries[id] ?? '') ?? 0));
            final remaining = (lineTotal - sumOthers).clamp(0, lineTotal);
            entries[personId] = amountToInputString(remaining);
          } else if (mode == SplitMode.percentage) {
            final sumOthers = selectedIds
                .where((id) => id != personId)
                .fold<double>(
                    0.0,
                    (s, id) =>
                        s + (double.tryParse(entries[id] ?? '') ?? 0.0));
            final remaining = (100.0 - sumOthers).clamp(0.0, 100.0);
            entries[personId] = remaining.toStringAsFixed(2);
          }
        }
      } else {
        selected.remove(personId);
      }
    });
  }

  void selectEveryone() {
    setState(() {
      selected = bill.people.map((p) => p.id).toSet();
      if (mode == SplitMode.quantity) {
        for (final p in bill.people) {
          entries.putIfAbsent(p.id, () => '1');
        }
      }
    });
  }

  void clearPeople() {
    setState(() {
      selected.clear();
      entries.clear();
    });
  }

  void splitEvenly() {
    if (selectedIds.isEmpty) return;
    final lineTotal = lineTotalOf(item);
    final count = selectedIds.length;

    setState(() {
      if (mode == SplitMode.custom) {
        final parts = distributeEvenly(lineTotal, count);
        for (int i = 0; i < count; i++) {
          entries[selectedIds[i]] = amountToInputString(parts[i]);
        }
      } else if (mode == SplitMode.percentage) {
        final base = 10000 ~/ count;
        for (int i = 0; i < count; i++) {
          final bp = (i == count - 1) ? 10000 - base * (count - 1) : base;
          entries[selectedIds[i]] = (bp / 100.0).toStringAsFixed(2);
        }
      } else if (mode == SplitMode.quantity) {
        final parts = distributeEvenly(item.quantity, count);
        for (int i = 0; i < count; i++) {
          entries[selectedIds[i]] = parts[i].toString();
        }
      }
    });
  }

  bool hasInvalidEntry() {
    switch (mode) {
      case SplitMode.quantity:
        return selectedIds.any((id) {
          final u = int.tryParse(entries[id] ?? '');
          return u == null || u < 0;
        });
      case SplitMode.custom:
        return selectedIds.any((id) {
          final p = parseAmount(entries[id] ?? '');
          return p == null || p < 0;
        });
      case SplitMode.percentage:
        return selectedIds.any((id) {
          final pct = double.tryParse(entries[id] ?? '');
          return pct == null || pct < 0 || pct > 100;
        });
      case SplitMode.equal:
        return false;
    }
  }
}
