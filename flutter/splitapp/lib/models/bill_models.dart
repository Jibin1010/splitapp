/// Bill, HistoryEntry, and Settings models for SplitLedger.
library;

import 'currency_models.dart';
import 'allocation_models.dart';
import 'adjustment_models.dart';
import 'settlement_models.dart';

class Bill {
  final String id;
  final String name;
  final CurrencyCode currency;
  final List<ProductItem> items;
  final List<Person> people;
  final List<Adjustment> adjustments;
  final String? vendor;
  final String? date;
  final String? invoiceNumber;
  final String createdAt;
  final String updatedAt;

  const Bill({
    required this.id,
    required this.name,
    this.currency = CurrencyCode.inr,
    this.items = const [],
    this.people = const [],
    this.adjustments = const [],
    this.vendor,
    this.date,
    this.invoiceNumber,
    required this.createdAt,
    required this.updatedAt,
  });

  Bill copyWith({
    String? id,
    String? name,
    CurrencyCode? currency,
    List<ProductItem>? items,
    List<Person>? people,
    List<Adjustment>? adjustments,
    String? vendor,
    String? date,
    String? invoiceNumber,
    String? createdAt,
    String? updatedAt,
  }) {
    return Bill(
      id: id ?? this.id,
      name: name ?? this.name,
      currency: currency ?? this.currency,
      items: items ?? this.items,
      people: people ?? this.people,
      adjustments: adjustments ?? this.adjustments,
      vendor: vendor ?? this.vendor,
      date: date ?? this.date,
      invoiceNumber: invoiceNumber ?? this.invoiceNumber,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'currency': currency.code,
    'items': items.map((e) => e.toJson()).toList(),
    'people': people.map((e) => e.toJson()).toList(),
    'adjustments': adjustments.map((e) => e.toJson()).toList(),
    if (vendor != null) 'vendor': vendor,
    if (date != null) 'date': date,
    if (invoiceNumber != null) 'invoiceNumber': invoiceNumber,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
  };

  factory Bill.fromJson(Map<String, dynamic> json) {
    return Bill(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      currency: CurrencyCodeExtension.fromString(json['currency'] as String? ?? 'INR'),
      items: (json['items'] as List<dynamic>?)
          ?.map((e) => ProductItem.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      people: (json['people'] as List<dynamic>?)
          ?.map((e) => Person.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      adjustments: (json['adjustments'] as List<dynamic>?)
          ?.map((e) => Adjustment.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      vendor: json['vendor'] as String?,
      date: json['date'] as String?,
      invoiceNumber: json['invoiceNumber'] as String?,
      createdAt: json['createdAt'] as String? ?? DateTime.now().toIso8601String(),
      updatedAt: json['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
    );
  }
}

class HistoryEntry {
  final String id;
  final String savedAt;
  final Bill bill;
  final CalculationResult? result;

  const HistoryEntry({
    required this.id,
    required this.savedAt,
    required this.bill,
    this.result,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'savedAt': savedAt,
    'bill': bill.toJson(),
    if (result != null) 'result': result!.toJson(),
  };

  factory HistoryEntry.fromJson(Map<String, dynamic> json) {
    return HistoryEntry(
      id: json['id'] as String? ?? '',
      savedAt: json['savedAt'] as String? ?? '',
      bill: Bill.fromJson(json['bill'] as Map<String, dynamic>? ?? {}),
      result: json['result'] != null
          ? CalculationResult.fromJson(json['result'] as Map<String, dynamic>)
          : null,
    );
  }
}

class Settings {
  final CurrencyCode currency;

  const Settings({this.currency = CurrencyCode.inr});

  Map<String, dynamic> toJson() => {'currency': currency.code};

  factory Settings.fromJson(Map<String, dynamic> json) {
    return Settings(
      currency: CurrencyCodeExtension.fromString(json['currency'] as String? ?? 'INR'),
    );
  }
}
