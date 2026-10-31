/// Participant and product allocation models for SplitLedger.
library;

enum SplitMode { equal, quantity, custom, percentage }

extension SplitModeExtension on SplitMode {
  String get modeKey {
    switch (this) {
      case SplitMode.equal:
        return 'equal';
      case SplitMode.quantity:
        return 'quantity';
      case SplitMode.custom:
        return 'custom';
      case SplitMode.percentage:
        return 'percentage';
    }
  }

  String get label {
    switch (this) {
      case SplitMode.equal:
        return 'Split equally';
      case SplitMode.quantity:
        return 'By quantity';
      case SplitMode.custom:
        return 'Custom amounts';
      case SplitMode.percentage:
        return 'Percentages';
    }
  }

  String get hint {
    switch (this) {
      case SplitMode.equal:
        return 'Same amount for everyone chosen';
      case SplitMode.quantity:
        return 'Units consumed per person';
      case SplitMode.custom:
        return 'Exact money amounts per person';
      case SplitMode.percentage:
        return 'Percent weights per person';
    }
  }

  static SplitMode fromString(String str) {
    switch (str.toLowerCase()) {
      case 'quantity':
        return SplitMode.quantity;
      case 'custom':
        return SplitMode.custom;
      case 'percentage':
        return SplitMode.percentage;
      case 'equal':
      default:
        return SplitMode.equal;
    }
  }
}

class Person {
  final String id;
  final String name;
  final int paidAmount; // in paise
  final String? photo;

  const Person({
    required this.id,
    required this.name,
    this.paidAmount = 0,
    this.photo,
  });

  Person copyWith({
    String? id,
    String? name,
    int? paidAmount,
    String? photo,
  }) {
    return Person(
      id: id ?? this.id,
      name: name ?? this.name,
      paidAmount: paidAmount ?? this.paidAmount,
      photo: photo ?? this.photo,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'paidAmount': paidAmount,
    if (photo != null) 'photo': photo,
  };

  factory Person.fromJson(Map<String, dynamic> json) {
    return Person(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      paidAmount: (json['paidAmount'] as num?)?.toInt() ?? 0,
      photo: json['photo'] as String?,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Person &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          paidAmount == other.paidAmount &&
          photo == other.photo;

  @override
  int get hashCode => Object.hash(id, name, paidAmount, photo);

  @override
  String toString() => 'Person($id, $name, paid: $paidAmount)';
}

class Allocation {
  final SplitMode mode;
  final List<String> participantIds; // Used when mode == equal
  final Map<String, int> quantityShares; // Used when mode == quantity (units)
  final Map<String, int> customShares; // Used when mode == custom (paise)
  final Map<String, double> percentageShares; // Used when mode == percentage (%)

  const Allocation({
    required this.mode,
    this.participantIds = const [],
    this.quantityShares = const {},
    this.customShares = const {},
    this.percentageShares = const {},
  });

  factory Allocation.equal(List<String> ids) => Allocation(
    mode: SplitMode.equal,
    participantIds: List.unmodifiable(ids),
  );

  factory Allocation.quantity(Map<String, int> shares) => Allocation(
    mode: SplitMode.quantity,
    quantityShares: Map.unmodifiable(shares),
  );

  factory Allocation.custom(Map<String, int> shares) => Allocation(
    mode: SplitMode.custom,
    customShares: Map.unmodifiable(shares),
  );

  factory Allocation.percentage(Map<String, double> shares) => Allocation(
    mode: SplitMode.percentage,
    percentageShares: Map.unmodifiable(shares),
  );

  Allocation copyWith({
    SplitMode? mode,
    List<String>? participantIds,
    Map<String, int>? quantityShares,
    Map<String, int>? customShares,
    Map<String, double>? percentageShares,
  }) {
    return Allocation(
      mode: mode ?? this.mode,
      participantIds: participantIds ?? this.participantIds,
      quantityShares: quantityShares ?? this.quantityShares,
      customShares: customShares ?? this.customShares,
      percentageShares: percentageShares ?? this.percentageShares,
    );
  }

  Map<String, dynamic> toJson() {
    switch (mode) {
      case SplitMode.equal:
        return {
          'mode': 'equal',
          'participantIds': participantIds,
        };
      case SplitMode.quantity:
        return {
          'mode': 'quantity',
          'shares': quantityShares,
        };
      case SplitMode.custom:
        return {
          'mode': 'custom',
          'shares': customShares,
        };
      case SplitMode.percentage:
        return {
          'mode': 'percentage',
          'shares': percentageShares,
        };
    }
  }

  factory Allocation.fromJson(Map<String, dynamic> json) {
    final modeStr = json['mode'] as String? ?? 'equal';
    final mode = SplitModeExtension.fromString(modeStr);
    switch (mode) {
      case SplitMode.equal:
        final ids = (json['participantIds'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ?? [];
        return Allocation.equal(ids);
      case SplitMode.quantity:
        final rawShares = (json['shares'] as Map<String, dynamic>?) ?? {};
        final shares = rawShares.map((k, v) => MapEntry(k, (v as num).toInt()));
        return Allocation.quantity(shares);
      case SplitMode.custom:
        final rawShares = (json['shares'] as Map<String, dynamic>?) ?? {};
        final shares = rawShares.map((k, v) => MapEntry(k, (v as num).toInt()));
        return Allocation.custom(shares);
      case SplitMode.percentage:
        final rawShares = (json['shares'] as Map<String, dynamic>?) ?? {};
        final shares = rawShares.map((k, v) => MapEntry(k, (v as num).toDouble()));
        return Allocation.percentage(shares);
    }
  }
}

class ProductItem {
  final String id;
  final String name;
  final int quantity; // Integer >= 1
  final int unitPrice; // in paise
  final Allocation allocation;

  const ProductItem({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.allocation,
  });

  ProductItem copyWith({
    String? id,
    String? name,
    int? quantity,
    int? unitPrice,
    Allocation? allocation,
  }) {
    return ProductItem(
      id: id ?? this.id,
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      allocation: allocation ?? this.allocation,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'quantity': quantity,
    'unitPrice': unitPrice,
    'allocation': allocation.toJson(),
  };

  factory ProductItem.fromJson(Map<String, dynamic> json) {
    return ProductItem(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toInt() ?? 0,
      allocation: Allocation.fromJson(json['allocation'] as Map<String, dynamic>? ?? {}),
    );
  }
}
