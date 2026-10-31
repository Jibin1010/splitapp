part of 'bill_state.dart';

extension BillStateMutators on BillState {
  void addItem(ProductItem item) {
    _bill = _bill.copyWith(items: [..._bill.items, item]);
    _touch();
  }

  void updateItem(
    String itemId, {
    String? name,
    int? quantity,
    int? unitPrice,
  }) {
    _bill = _bill.copyWith(
      items: _bill.items.map((item) {
        if (item.id != itemId) return item;
        return item.copyWith(
          name: name ?? item.name,
          quantity: quantity ?? item.quantity,
          unitPrice: unitPrice ?? item.unitPrice,
        );
      }).toList(),
    );
    _touch();
  }

  void removeItem(String itemId) {
    _bill = _bill.copyWith(
      items: _bill.items.where((item) => item.id != itemId).toList(),
    );
    _touch();
  }

  void duplicateItem(String itemId) {
    final sourceIndex = _bill.items.indexWhere((i) => i.id == itemId);
    if (sourceIndex == -1) return;
    final source = _bill.items[sourceIndex];
    final copy = source.copyWith(
      id: newId('item'),
      name: '${source.name.isEmpty ? 'Untitled product' : source.name} (copy)',
      allocation: Allocation.fromJson(source.allocation.toJson()),
    );
    final items = List<ProductItem>.from(_bill.items)
      ..insert(sourceIndex + 1, copy);
    _bill = _bill.copyWith(items: items);
    _touch();
  }

  void setAllocation(String itemId, Allocation allocation) {
    _bill = _bill.copyWith(
      items: _bill.items.map((item) {
        if (item.id != itemId) return item;
        return item.copyWith(allocation: allocation);
      }).toList(),
    );
    _touch();
  }

  void addPerson(String name, {String? photo, bool switchTo = false}) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return;
    final finalPhoto = (photo != null && photo.trim().isNotEmpty)
        ? photo.trim()
        : getRandomAvatarForName(trimmed);
    final newPerson = Person(
      id: newId('person'),
      name: trimmed,
      paidAmount: 0,
      photo: finalPhoto,
    );
    _bill = _bill.copyWith(people: [..._bill.people, newPerson]);
    if (switchTo) {
      _activePersonId = newPerson.id;
      _storage.saveActivePersonId(newPerson.id);
    }
    _touch();
  }

  void renamePerson(String personId, String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return;
    _bill = _bill.copyWith(
      people: _bill.people.map((p) {
        if (p.id != personId) return p;
        return p.copyWith(name: trimmed);
      }).toList(),
    );
    _touch();
  }

  void setPersonPhoto(String personId, String photo) {
    _bill = _bill.copyWith(
      people: _bill.people.map((p) {
        if (p.id != personId) return p;
        return p.copyWith(photo: photo.trim().isEmpty ? null : photo.trim());
      }).toList(),
    );
    _touch();
  }

  void removePerson(String personId) {
    if (_activePersonId == personId) {
      _activePersonId = null;
    }
    _bill = _bill.copyWith(
      people: _bill.people.where((p) => p.id != personId).toList(),
      items: _bill.items.map((item) {
        return item.copyWith(
          allocation: allocationWithoutPerson(item.allocation, personId),
        );
      }).toList(),
    );
    _touch();
  }

  void setPaidAmount(String personId, int amount) {
    _bill = _bill.copyWith(
      people: _bill.people.map((p) {
        if (p.id != personId) return p;
        return p.copyWith(paidAmount: amount < 0 ? 0 : amount);
      }).toList(),
    );
    _touch();
  }

  void payRemaining(String personId) {
    final totals = billTotalsOf(_bill);
    final othersPaid = _bill.people
        .where((p) => p.id != personId)
        .fold<int>(0, (s, p) => s + p.paidAmount);
    final remaining = (totals.billTotal - othersPaid).clamp(0, 1000000000000);
    _bill = _bill.copyWith(
      people: _bill.people.map((p) {
        if (p.id != personId) return p;
        return p.copyWith(paidAmount: remaining);
      }).toList(),
    );
    _touch();
  }

  void splitEqualPaid() {
    if (_bill.people.isEmpty) return;
    final total = preview.billTotal;
    final share = (total / _bill.people.length).round();
    int running = 0;
    final updated = _bill.people.asMap().entries.map((entry) {
      final idx = entry.key;
      final p = entry.value;
      if (idx == _bill.people.length - 1) {
        return p.copyWith(paidAmount: (total - running).clamp(0, total));
      } else {
        running += share;
        return p.copyWith(paidAmount: share);
      }
    }).toList();
    _bill = _bill.copyWith(people: updated);
    _touch();
  }

  void setSingleHeadPayer(String personId) {
    final total = preview.billTotal;
    _bill = _bill.copyWith(
      people: _bill.people.map((p) {
        return p.copyWith(paidAmount: p.id == personId ? total : 0);
      }).toList(),
    );
    _touch();
  }

  void autoBalanceToFirstPerson() {
    if (_bill.people.isEmpty) return;
    final total = preview.billTotal;
    final currentPaid =
        _bill.people.fold<int>(0, (sum, p) => sum + p.paidAmount);
    final diff = total - currentPaid;
    if (diff == 0) return;

    final first = _bill.people.first;
    final newAmount = (first.paidAmount + diff).clamp(0, 1000000000000);
    _bill = _bill.copyWith(
      people: _bill.people.map((p) {
        if (p.id == first.id) {
          return p.copyWith(paidAmount: newAmount);
        }
        return p;
      }).toList(),
    );
    _touch();
  }

  void addAdjustment(Adjustment adjustment) {
    _bill = _bill.copyWith(adjustments: [..._bill.adjustments, adjustment]);
    _touch();
  }

  void updateAdjustment(
    String adjustmentId, {
    String? label,
    AdjustmentKind? kind,
    AdjustmentMethod? method,
    double? value,
  }) {
    _bill = _bill.copyWith(
      adjustments: _bill.adjustments.map((adj) {
        if (adj.id != adjustmentId) return adj;
        return adj.copyWith(
          label: label ?? adj.label,
          kind: kind ?? adj.kind,
          method: method ?? adj.method,
          value: value ?? adj.value,
        );
      }).toList(),
    );
    _touch();
  }

  void removeAdjustment(String adjustmentId) {
    _bill = _bill.copyWith(
      adjustments:
          _bill.adjustments.where((adj) => adj.id != adjustmentId).toList(),
    );
    _touch();
  }

  void importAnalysisResult({
    required List<ProductItem> items,
    required List<Person> people,
    required List<Adjustment> adjustments,
    Map<String, int>? headPayers,
    String? billName,
    String? date,
    String? invoiceNumber,
    bool replaceExistingItems = true,
    bool replaceExistingPeople = false,
  }) {
    List<Person> nextPeople;
    if (replaceExistingPeople || _bill.people.isEmpty) {
      nextPeople = List.from(people);
    } else {
      final existingIds = _bill.people.map((p) => p.id).toSet();
      final newToAdd = people.where((p) => !existingIds.contains(p.id));
      nextPeople = [..._bill.people, ...newToAdd];
    }

    if (headPayers != null && headPayers.isNotEmpty) {
      nextPeople = nextPeople.map((p) {
        if (headPayers.containsKey(p.id)) {
          return p.copyWith(paidAmount: headPayers[p.id]!);
        }
        return p;
      }).toList();
    }

    final nextItems = replaceExistingItems ? items : [..._bill.items, ...items];
    final nextAdjustments = replaceExistingItems
        ? adjustments
        : [..._bill.adjustments, ...adjustments];

    _bill = _bill.copyWith(
      name: (billName != null && billName.isNotEmpty) ? billName : _bill.name,
      date: date ?? _bill.date,
      invoiceNumber: invoiceNumber ?? _bill.invoiceNumber,
      people: nextPeople,
      items: nextItems,
      adjustments: nextAdjustments,
    );
    _touch();
  }
}
