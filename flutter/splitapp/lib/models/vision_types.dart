/// Vision OCR and AI bill receipt parsing models.
library;

class DetectedBillItem {
  final String name;
  final int quantity;
  final int unitPricePaise;
  final int totalPaise;

  const DetectedBillItem({
    required this.name,
    required this.quantity,
    required this.unitPricePaise,
    required this.totalPaise,
  });

  DetectedBillItem copyWith({
    String? name,
    int? quantity,
    int? unitPricePaise,
    int? totalPaise,
  }) {
    return DetectedBillItem(
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      unitPricePaise: unitPricePaise ?? this.unitPricePaise,
      totalPaise: totalPaise ?? this.totalPaise,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'quantity': quantity,
    'unitPricePaise': unitPricePaise,
    'totalPaise': totalPaise,
  };

  factory DetectedBillItem.fromJson(Map<String, dynamic> json) {
    return DetectedBillItem(
      name: json['name'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPricePaise: (json['unitPricePaise'] as num?)?.toInt() ?? 0,
      totalPaise: (json['totalPaise'] as num?)?.toInt() ?? 0,
    );
  }
}

class ParsedReceiptResult {
  final String rawText;
  final String? vendor;
  final String? date;
  final String? invoiceNumber;
  final int? subtotalPaise;
  final int? cgstPaise;
  final int? sgstPaise;
  final int? taxPaise;
  final int? grandTotalPaise;
  final List<DetectedBillItem> items;

  const ParsedReceiptResult({
    required this.rawText,
    this.vendor,
    this.date,
    this.invoiceNumber,
    this.subtotalPaise,
    this.cgstPaise,
    this.sgstPaise,
    this.taxPaise,
    this.grandTotalPaise,
    this.items = const [],
  });
}

class VisionApiResponse {
  final bool ok;
  final String? model;
  final bool fallbackUsed;
  final int? durationMs;
  final String? rawText;
  final String? vendor;
  final String? date;
  final String? invoiceNumber;
  final int? subtotalPaise;
  final int? cgstPaise;
  final int? sgstPaise;
  final int? taxPaise;
  final int? grandTotalPaise;
  final List<DetectedBillItem> detectedItems;
  final String? description;
  final String? errorMessage;
  final String? errorCode;

  const VisionApiResponse({
    required this.ok,
    this.model,
    this.fallbackUsed = false,
    this.durationMs,
    this.rawText,
    this.vendor,
    this.date,
    this.invoiceNumber,
    this.subtotalPaise,
    this.cgstPaise,
    this.sgstPaise,
    this.taxPaise,
    this.grandTotalPaise,
    this.detectedItems = const [],
    this.description,
    this.errorMessage,
    this.errorCode,
  });
}
