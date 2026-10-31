/// Settlement, validation, and calculation result models for SplitLedger.
library;

class Settlement {
  final String fromPersonId;
  final String toPersonId;
  final int amount; // in paise

  const Settlement({
    required this.fromPersonId,
    required this.toPersonId,
    required this.amount,
  });

  Map<String, dynamic> toJson() => {
    'fromPersonId': fromPersonId,
    'toPersonId': toPersonId,
    'amount': amount,
  };

  factory Settlement.fromJson(Map<String, dynamic> json) {
    return Settlement(
      fromPersonId: json['fromPersonId'] as String? ?? json['from'] as String? ?? '',
      toPersonId: json['toPersonId'] as String? ?? json['to'] as String? ?? '',
      amount: (json['amount'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Settlement &&
          runtimeType == other.runtimeType &&
          fromPersonId == other.fromPersonId &&
          toPersonId == other.toPersonId &&
          amount == other.amount;

  @override
  int get hashCode => Object.hash(fromPersonId, toPersonId, amount);

  @override
  String toString() => 'Settlement($fromPersonId -> $toPersonId: $amount)';
}

enum IssueCode {
  emptyBill,
  noPeople,
  duplicateName,
  invalidItem,
  invalidPerson,
  invalidAdjustment,
  itemUnassigned,
  customSumMismatch,
  percentSumMismatch,
  quantityMismatch,
  paidTotalMismatch,
  negativeTotal,
}

extension IssueCodeExtension on IssueCode {
  String get codeKey {
    switch (this) {
      case IssueCode.emptyBill:
        return 'EMPTY_BILL';
      case IssueCode.noPeople:
        return 'NO_PEOPLE';
      case IssueCode.duplicateName:
        return 'DUPLICATE_NAME';
      case IssueCode.invalidItem:
        return 'INVALID_ITEM';
      case IssueCode.invalidPerson:
        return 'INVALID_PERSON';
      case IssueCode.invalidAdjustment:
        return 'INVALID_ADJUSTMENT';
      case IssueCode.itemUnassigned:
        return 'ITEM_UNASSIGNED';
      case IssueCode.customSumMismatch:
        return 'CUSTOM_SUM_MISMATCH';
      case IssueCode.percentSumMismatch:
        return 'PERCENT_SUM_MISMATCH';
      case IssueCode.quantityMismatch:
        return 'QUANTITY_MISMATCH';
      case IssueCode.paidTotalMismatch:
        return 'PAID_TOTAL_MISMATCH';
      case IssueCode.negativeTotal:
        return 'NEGATIVE_TOTAL';
    }
  }

  static IssueCode fromString(String str) {
    switch (str.toUpperCase()) {
      case 'EMPTY_BILL':
        return IssueCode.emptyBill;
      case 'NO_PEOPLE':
        return IssueCode.noPeople;
      case 'DUPLICATE_NAME':
        return IssueCode.duplicateName;
      case 'INVALID_ITEM':
        return IssueCode.invalidItem;
      case 'INVALID_PERSON':
        return IssueCode.invalidPerson;
      case 'INVALID_ADJUSTMENT':
        return IssueCode.invalidAdjustment;
      case 'ITEM_UNASSIGNED':
        return IssueCode.itemUnassigned;
      case 'CUSTOM_SUM_MISMATCH':
        return IssueCode.customSumMismatch;
      case 'PERCENT_SUM_MISMATCH':
        return IssueCode.percentSumMismatch;
      case 'QUANTITY_MISMATCH':
        return IssueCode.quantityMismatch;
      case 'PAID_TOTAL_MISMATCH':
        return IssueCode.paidTotalMismatch;
      case 'NEGATIVE_TOTAL':
        return IssueCode.negativeTotal;
      default:
        return IssueCode.invalidItem;
    }
  }
}

class ValidationIssue {
  final IssueCode code;
  final String message;
  final String? itemId;
  final String? personId;
  final String? adjustmentId;

  const ValidationIssue({
    required this.code,
    required this.message,
    this.itemId,
    this.personId,
    this.adjustmentId,
  });

  Map<String, dynamic> toJson() => {
    'code': code.codeKey,
    'message': message,
    if (itemId != null) 'itemId': itemId,
    if (personId != null) 'personId': personId,
    if (adjustmentId != null) 'adjustmentId': adjustmentId,
  };

  factory ValidationIssue.fromJson(Map<String, dynamic> json) {
    return ValidationIssue(
      code: IssueCodeExtension.fromString(json['code'] as String? ?? ''),
      message: json['message'] as String? ?? '',
      itemId: json['itemId'] as String?,
      personId: json['personId'] as String?,
      adjustmentId: json['adjustmentId'] as String?,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ValidationIssue &&
          runtimeType == other.runtimeType &&
          code == other.code &&
          message == other.message &&
          itemId == other.itemId &&
          personId == other.personId &&
          adjustmentId == other.adjustmentId;

  @override
  int get hashCode => Object.hash(code, message, itemId, personId, adjustmentId);
}

class PersonResult {
  final String personId;
  final int share; // in paise
  final int paid; // in paise
  final int net; // paid - share. Positive: gets back. Negative: owes.
  final Map<String, int> itemContributions; // itemId -> paise

  const PersonResult({
    required this.personId,
    required this.share,
    required this.paid,
    required this.net,
    required this.itemContributions,
  });

  Map<String, dynamic> toJson() => {
    'personId': personId,
    'share': share,
    'paid': paid,
    'net': net,
    'itemContributions': itemContributions,
  };

  factory PersonResult.fromJson(Map<String, dynamic> json) {
    final rawContrib = (json['itemContributions'] as Map<String, dynamic>?) ?? {};
    return PersonResult(
      personId: json['personId'] as String? ?? '',
      share: (json['share'] as num?)?.toInt() ?? 0,
      paid: (json['paid'] as num?)?.toInt() ?? 0,
      net: (json['net'] as num?)?.toInt() ?? 0,
      itemContributions: rawContrib.map((k, v) => MapEntry(k, (v as num).toInt())),
    );
  }
}

class CalculationResult {
  final bool valid;
  final List<ValidationIssue> issues;
  final int itemsTotal; // in paise
  final int adjustmentsTotal; // signed in paise
  final int billTotal; // in paise
  final int unassignedValue; // in paise
  final Map<String, Map<String, int>> itemAllocations; // itemId -> personId -> paise
  final Map<String, Map<String, int>> adjustmentAllocations; // adjustmentId -> personId -> paise
  final Map<String, PersonResult> people; // personId -> PersonResult
  final List<Settlement> settlements;

  const CalculationResult({
    required this.valid,
    required this.issues,
    required this.itemsTotal,
    required this.adjustmentsTotal,
    required this.billTotal,
    required this.unassignedValue,
    required this.itemAllocations,
    required this.adjustmentAllocations,
    required this.people,
    required this.settlements,
  });

  Map<String, dynamic> toJson() => {
    'valid': valid,
    'issues': issues.map((e) => e.toJson()).toList(),
    'itemsTotal': itemsTotal,
    'adjustmentsTotal': adjustmentsTotal,
    'billTotal': billTotal,
    'unassignedValue': unassignedValue,
    'itemAllocations': itemAllocations,
    'adjustmentAllocations': adjustmentAllocations,
    'people': people.map((k, v) => MapEntry(k, v.toJson())),
    'settlements': settlements.map((e) => e.toJson()).toList(),
  };

  factory CalculationResult.fromJson(Map<String, dynamic> json) {
    final rawItemAlloc = (json['itemAllocations'] as Map<String, dynamic>?) ?? {};
    final itemAllocations = rawItemAlloc.map((k, v) {
      final inner = (v as Map<String, dynamic>?) ?? {};
      return MapEntry(k, inner.map((ik, iv) => MapEntry(ik, (iv as num).toInt())));
    });

    final rawAdjAlloc = (json['adjustmentAllocations'] as Map<String, dynamic>?) ?? {};
    final adjustmentAllocations = rawAdjAlloc.map((k, v) {
      final inner = (v as Map<String, dynamic>?) ?? {};
      return MapEntry(k, inner.map((ik, iv) => MapEntry(ik, (iv as num).toInt())));
    });

    final rawPeople = (json['people'] as Map<String, dynamic>?) ?? {};
    final people = rawPeople.map(
      (k, v) => MapEntry(k, PersonResult.fromJson(v as Map<String, dynamic>)),
    );

    return CalculationResult(
      valid: json['valid'] as bool? ?? false,
      issues: (json['issues'] as List<dynamic>?)
          ?.map((e) => ValidationIssue.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      itemsTotal: (json['itemsTotal'] as num?)?.toInt() ?? 0,
      adjustmentsTotal: (json['adjustmentsTotal'] as num?)?.toInt() ?? 0,
      billTotal: (json['billTotal'] as num?)?.toInt() ?? 0,
      unassignedValue: (json['unassignedValue'] as num?)?.toInt() ?? 0,
      itemAllocations: itemAllocations,
      adjustmentAllocations: adjustmentAllocations,
      people: people,
      settlements: (json['settlements'] as List<dynamic>?)
          ?.map((e) => Settlement.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
    );
  }
}
