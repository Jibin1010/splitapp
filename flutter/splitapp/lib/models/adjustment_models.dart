/// Bill adjustments models for SplitLedger.
library;

enum AdjustmentKind { serviceCharge, tax, discount }

extension AdjustmentKindExtension on AdjustmentKind {
  String get kindKey {
    switch (this) {
      case AdjustmentKind.serviceCharge:
        return 'service_charge';
      case AdjustmentKind.tax:
        return 'tax';
      case AdjustmentKind.discount:
        return 'discount';
    }
  }

  String get label {
    switch (this) {
      case AdjustmentKind.serviceCharge:
        return 'Service charge';
      case AdjustmentKind.tax:
        return 'Tax';
      case AdjustmentKind.discount:
        return 'Discount';
    }
  }

  static AdjustmentKind fromString(String str) {
    switch (str.toLowerCase()) {
      case 'tax':
        return AdjustmentKind.tax;
      case 'discount':
        return AdjustmentKind.discount;
      case 'service_charge':
      default:
        return AdjustmentKind.serviceCharge;
    }
  }
}

enum AdjustmentMethod { percent, fixed }

extension AdjustmentMethodExtension on AdjustmentMethod {
  String get methodKey {
    switch (this) {
      case AdjustmentMethod.percent:
        return 'percent';
      case AdjustmentMethod.fixed:
        return 'fixed';
    }
  }

  String get label {
    switch (this) {
      case AdjustmentMethod.percent:
        return 'Percent';
      case AdjustmentMethod.fixed:
        return 'Fixed';
    }
  }

  static AdjustmentMethod fromString(String str) {
    switch (str.toLowerCase()) {
      case 'fixed':
        return AdjustmentMethod.fixed;
      case 'percent':
      default:
        return AdjustmentMethod.percent;
    }
  }
}

class Adjustment {
  final String id;
  final String label;
  final AdjustmentKind kind;
  final AdjustmentMethod method;
  final double value; // Percent (e.g. 10 for 10%) or paise if fixed
  final Map<String, double>? shares;

  const Adjustment({
    required this.id,
    required this.label,
    required this.kind,
    required this.method,
    required this.value,
    this.shares,
  });

  Adjustment copyWith({
    String? id,
    String? label,
    AdjustmentKind? kind,
    AdjustmentMethod? method,
    double? value,
    Map<String, double>? shares,
  }) {
    return Adjustment(
      id: id ?? this.id,
      label: label ?? this.label,
      kind: kind ?? this.kind,
      method: method ?? this.method,
      value: value ?? this.value,
      shares: shares ?? this.shares,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'label': label,
    'kind': kind.kindKey,
    'method': method.methodKey,
    'value': value,
    if (shares != null) 'shares': shares,
  };

  factory Adjustment.fromJson(Map<String, dynamic> json) {
    Map<String, double>? sharesMap;
    if (json['shares'] is Map) {
      sharesMap = (json['shares'] as Map).map(
        (k, v) => MapEntry(k.toString(), (v as num).toDouble()),
      );
    }
    return Adjustment(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      kind: AdjustmentKindExtension.fromString(json['kind'] as String? ?? ''),
      method: AdjustmentMethodExtension.fromString(json['method'] as String? ?? ''),
      value: (json['value'] as num?)?.toDouble() ?? 0.0,
      shares: sharesMap,
    );
  }
}
