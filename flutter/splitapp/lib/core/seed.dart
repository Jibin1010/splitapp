import '../models/split_types.dart';
import 'id.dart';

/// Sample data for visual testing on first visit — exactly matches the ReactNext dashboard.
Bill createSampleBill() {
  final now = DateTime.now().toIso8601String();
  final mayaId = newId('person');
  final arjunId = newId('person');
  final nehaId = newId('person');
  final raviId = newId('person');

  ProductItem item(
    String name,
    int quantity,
    int unitPriceRupees,
    List<String> participantIds,
  ) {
    return ProductItem(
      id: newId('item'),
      name: name,
      quantity: quantity,
      unitPrice: unitPriceRupees * 100,
      allocation: Allocation.equal(participantIds),
    );
  }

  return Bill(
    id: newId('bill'),
    name: 'The Daily Grind',
    currency: CurrencyCode.inr,
    vendor: 'The Daily Grind, NY',
    date: 'Oct 18, 2026',
    invoiceNumber: 'INV-8829',
    items: [
      item('Pizza', 2, 450, [mayaId, arjunId]),
      item('Garlic bread', 1, 180, [mayaId, nehaId]),
      item('Pasta', 2, 320, [mayaId, nehaId]),
      item('Cold coffee', 3, 160, [arjunId, nehaId, raviId]),
      item('Brownie', 2, 130, [nehaId, raviId]),
    ],
    people: [
      Person(
        id: mayaId,
        name: 'Maya',
        paidAmount: 246000,
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: arjunId,
        name: 'Arjun',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: nehaId,
        name: 'Neha',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: raviId,
        name: 'Ravi',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      ),
    ],
    adjustments: [
      Adjustment(
        id: newId('adj'),
        label: 'GST (incl. CGST & SGST)',
        kind: AdjustmentKind.tax,
        method: AdjustmentMethod.fixed,
        value: 23300.0,
      ),
    ],
    createdAt: now,
    updatedAt: now,
  );
}

/// 4 Head Payers sample bill matching Screenshot 3
Bill createMultiHeadPayerSampleBill() {
  final now = DateTime.now().toIso8601String();
  final mayaId = newId('person');
  final arjunId = newId('person');
  final nehaId = newId('person');
  final raviId = newId('person');
  final sandeepId = newId('person');
  final aaravId = newId('person');
  final fatimaId = newId('person');
  final radhikaId = newId('person');
  final kiranId = newId('person');

  ProductItem item(String name, int qty, int priceRs, List<String> pIds) {
    return ProductItem(
      id: newId('item'),
      name: name,
      quantity: qty,
      unitPrice: priceRs * 100,
      allocation: Allocation.equal(pIds),
    );
  }

  return Bill(
    id: newId('bill'),
    name: 'The Daily Grind — Group Dinner',
    currency: CurrencyCode.inr,
    vendor: 'The Daily Grind, NY',
    date: 'Oct 18, 2026',
    invoiceNumber: 'INV-8830',
    items: [
      item('Special Platter', 2, 800, [mayaId, arjunId, sandeepId, aaravId]),
      item('Main Courses', 4, 350, [nehaId, raviId, fatimaId, radhikaId]),
      item('Beverages & Drinks', 5, 120, [mayaId, arjunId, nehaId, raviId, kiranId]),
    ],
    people: [
      Person(
        id: mayaId,
        name: 'Maya',
        paidAmount: 120000, // ₹1,200.00
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: arjunId,
        name: 'Arjun',
        paidAmount: 90000, // ₹900.00
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: nehaId,
        name: 'Neha',
        paidAmount: 80000, // ₹800.00
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: raviId,
        name: 'Ravi',
        paidAmount: 70000, // ₹700.00
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: sandeepId,
        name: 'Sandeep',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: aaravId,
        name: 'Aarav',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: fatimaId,
        name: 'Fatima',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: radhikaId,
        name: 'Radhika',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      ),
      Person(
        id: kiranId,
        name: 'Kiran',
        paidAmount: 0,
        photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      ),
    ],
    adjustments: const [],
    createdAt: now,
    updatedAt: now,
  );
}

/// A fresh, empty bill.
Bill createEmptyBill([CurrencyCode currency = CurrencyCode.inr]) {
  final now = DateTime.now().toIso8601String();
  return Bill(
    id: newId('bill'),
    name: '',
    currency: currency,
    items: const [],
    people: const [],
    adjustments: const [],
    createdAt: now,
    updatedAt: now,
  );
}
