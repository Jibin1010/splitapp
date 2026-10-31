/// Settlement transfer engine for SplitLedger.
library;

import '../../models/split_types.dart';

class _Party {
  final String id;
  int amount;
  _Party(this.id, this.amount);
}

/// Deterministic settlement algorithm: match the largest debtor with the
/// largest creditor until every net balance reaches zero.
List<Settlement> computeSettlements(
  Map<String, PersonResult> people,
  List<Person> orderedPeople,
) {
  String nameOf(String id) =>
      orderedPeople.firstWhere((p) => p.id == id, orElse: () => Person(id: id, name: id)).name;

  final debtors = people.values
      .where((r) => r.net < 0)
      .map((r) => _Party(r.personId, -r.net))
      .toList();
  debtors.sort((a, b) {
    final diff = b.amount.compareTo(a.amount);
    if (diff != 0) return diff;
    return nameOf(a.id).compareTo(nameOf(b.id));
  });

  final creditors = people.values
      .where((r) => r.net > 0)
      .map((r) => _Party(r.personId, r.net))
      .toList();
  creditors.sort((a, b) {
    final diff = b.amount.compareTo(a.amount);
    if (diff != 0) return diff;
    return nameOf(a.id).compareTo(nameOf(b.id));
  });

  final settlements = <Settlement>[];
  int i = 0;
  int j = 0;
  while (i < debtors.length && j < creditors.length) {
    final debtor = debtors[i];
    final creditor = creditors[j];
    final amount = debtor.amount < creditor.amount ? debtor.amount : creditor.amount;
    if (amount > 0) {
      settlements.add(Settlement(
        fromPersonId: debtor.id,
        toPersonId: creditor.id,
        amount: amount,
      ));
    }
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount == 0) i++;
    if (creditor.amount == 0) j++;
  }
  return settlements;
}
