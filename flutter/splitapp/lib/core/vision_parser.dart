import 'dart:convert';
import 'dart:math';
import '../models/vision_types.dart';

/// Parses full AI output, extracting:
/// 1. Exact raw text (verbatim line-by-line OCR)
/// 2. Strict JSON structured products (with mathematical consistency reconciliation)
/// 3. Fallback table and line-by-line regex if JSON is missing or incomplete
ParsedReceiptResult parseReceiptResponse(String description) {
  String rawText = '';
  String vendor = '';
  String date = '';
  String invoiceNumber = '';
  double subtotal = 0;
  double cgst = 0;
  double sgst = 0;
  double tax = 0;
  double grandTotal = 0;
  final items = <DetectedBillItem>[];

  // 1. Extract rawText block (verbatim OCR)
  final rawTextMatch = RegExp(r'```(?:raw_text|text)\s*([\s\S]*?)\s*```', caseSensitive: false)
          .firstMatch(description) ??
      RegExp(r'#\s*(?:PART 1|EXACT TRANSCRIBED TEXT|RAW OCR)[^\n]*\n([\s\S]*?)(?=#\s*(?:PART 2|STRUCTURED)|```json|$)', caseSensitive: false)
          .firstMatch(description);

  if (rawTextMatch != null && rawTextMatch.group(1)?.trim().isNotEmpty == true) {
    rawText = rawTextMatch.group(1)!.trim();
  } else {
    final splitBeforeJson = description.split(RegExp(r'```json|\|[\s\S]*\|[\s\S]*\|', caseSensitive: false))[0].trim();
    rawText = splitBeforeJson.isNotEmpty ? splitBeforeJson : description.trim();
  }

  // 2. Extract JSON block
  final jsonMatch = RegExp(r'```(?:json)?\s*(\{[\s\S]*?"items"[\s\S]*?\})\s*```', caseSensitive: false)
          .firstMatch(description) ??
      RegExp(r'(\{[\s\S]*?"items"\s*:\s*\[[\s\S]*?\][\s\S]*?\})', caseSensitive: false)
          .firstMatch(description);

  if (jsonMatch != null) {
    try {
      final jsonStr = jsonMatch.group(1)!;
      final data = jsonDecode(jsonStr) as Map<String, dynamic>;
      vendor = data['vendor']?.toString() ?? '';
      date = data['date']?.toString() ?? '';
      invoiceNumber = (data['invoice_number'] ?? data['bill_no'] ?? data['token_no'] ?? '').toString();
      subtotal = (data['subtotal'] as num?)?.toDouble() ?? 0.0;
      cgst = (data['cgst'] as num?)?.toDouble() ?? 0.0;
      sgst = (data['sgst'] as num?)?.toDouble() ?? 0.0;
      tax = (data['tax'] as num?)?.toDouble() ?? (cgst + sgst);
      grandTotal = (data['grand_total'] as num?)?.toDouble() ?? 0.0;

      final rawItems = data['items'];
      if (rawItems is List) {
        for (final rawItem in rawItems) {
          if (rawItem is! Map<String, dynamic>) continue;
          final rawName = (rawItem['name'] ?? '').toString();
          final name = rawName.replaceAll(RegExp(r'^[\d\s.*•-]+'), '').trim();
          if (name.isEmpty || RegExp(r'subtotal|tax|total|grand|cgst|sgst', caseSensitive: false).hasMatch(name)) {
            continue;
          }

          double qty = (rawItem['quantity'] as num?)?.toDouble() ?? 0.0;
          double unitPrice = (rawItem['unit_price'] as num?)?.toDouble() ?? 0.0;
          double total = (rawItem['total'] as num?)?.toDouble() ?? 0.0;

          // Mathematical reconciliation
          if (unitPrice > 0 && total > 0) {
            if ((qty * unitPrice - total).abs() > 0.05) {
              if (unitPrice == total && qty > 0 && (total / qty - (total / qty).round()).abs() < 0.05) {
                final realPrice = qty;
                final realTotal = total;
                final realQty = (realTotal / realPrice).round().toDouble();
                qty = realQty;
                unitPrice = realPrice;
                total = realTotal;
              } else if ((total / unitPrice - (total / unitPrice).round()).abs() < 0.01) {
                qty = (total / unitPrice).round().toDouble();
              } else if (qty > 0) {
                unitPrice = ((total / qty) * 100).round() / 100.0;
              }
            }
          } else if (qty > 0 && total > 0 && unitPrice == 0) {
            unitPrice = ((total / qty) * 100).round() / 100.0;
          } else if (qty > 0 && unitPrice > 0 && total == 0) {
            total = ((qty * unitPrice) * 100).round() / 100.0;
          } else if (qty == 0 && unitPrice > 0 && total > 0) {
            qty = max(1, (total / unitPrice).round()).toDouble();
          }

          if (qty <= 0) qty = 1;
          if (unitPrice <= 0 && total > 0) unitPrice = total / qty;
          if (total <= 0 && unitPrice > 0) total = qty * unitPrice;

          items.add(DetectedBillItem(
            name: name,
            quantity: max(1, qty.round()),
            unitPricePaise: (unitPrice * 100).round(),
            totalPaise: (total * 100).round(),
          ));
        }
      }
    } catch (_) {
      // JSON parse failed; fall back to table and line parser
    }
  }

  // 3. Fallback: Table Extraction if JSON had no items
  if (items.isEmpty) {
    final lines = description.split('\n');
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.contains('---')) {
        final cols = trimmed
            .split('|')
            .map((c) => c.trim())
            .where((c) => c.isNotEmpty)
            .toList();
        if (cols.any((c) => RegExp(r'item|description|particular|quantity|qty|price|amount', caseSensitive: false).hasMatch(c))) {
          continue;
        }
        if (cols.any((c) => RegExp(r'subtotal|tax|total|grand|cgst|sgst', caseSensitive: false).hasMatch(c))) {
          continue;
        }

        final name = cols[0].replaceAll(RegExp(r'^[\d\s.*•-]+'), '').trim();
        final nums = cols
            .skip(1)
            .map((c) => double.tryParse(c.replaceAll(RegExp(r'[^0-9.]'), '')))
            .where((n) => n != null)
            .cast<double>()
            .toList();

        if (nums.length >= 3) {
          final n1 = nums[0];
          final n2 = nums[1];
          final n3 = nums[2];
          if ((n1 * n2 - n3).abs() < 0.1) {
            items.add(DetectedBillItem(name: name, quantity: n1.round(), unitPricePaise: (n2 * 100).round(), totalPaise: (n3 * 100).round()));
          } else if ((n2 * n1 - n3).abs() < 0.1) {
            items.add(DetectedBillItem(name: name, quantity: n2.round(), unitPricePaise: (n1 * 100).round(), totalPaise: (n3 * 100).round()));
          } else {
            items.add(DetectedBillItem(name: name, quantity: max(1, n1.round()), unitPricePaise: (n2 * 100).round(), totalPaise: (n3 * 100).round()));
          }
        } else if (nums.length == 2) {
          final n1 = nums[0];
          final n2 = nums[1];
          if (n1 > 0 && n2 > n1 && (n2 / n1 - (n2 / n1).round()).abs() < 0.05) {
            items.add(DetectedBillItem(name: name, quantity: (n2 / n1).round(), unitPricePaise: (n1 * 100).round(), totalPaise: (n2 * 100).round()));
          } else {
            items.add(DetectedBillItem(name: name, quantity: 1, unitPricePaise: (n1 * 100).round(), totalPaise: (n2 * 100).round()));
          }
        }
      }
    }
  }

  // 4. Fallback: Plain Text Line-by-Line Regex on rawText if still no items
  if (items.isEmpty && rawText.isNotEmpty) {
    final lines = rawText.split('\n');
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty || RegExp(r'^(total|subtotal|grand|cgst|sgst|tax|cashier|bill|date|token|gstin|item|dine)', caseSensitive: false).hasMatch(trimmed)) {
        continue;
      }
      // Check for "2x Item @ 350 = 700" or "2 * Item 350.00"
      final xMatch = RegExp(r'^(\d+)\s*[xX*]\s*(.+?)(?:\s*[@=]\s*|\s+)([0-9]+(?:\.[0-9]+)?)(?:\s*=\s*([0-9]+(?:\.[0-9]+)?))?$').firstMatch(trimmed);
      if (xMatch != null) {
        final q = int.tryParse(xMatch.group(1)!) ?? 1;
        final name = xMatch.group(2)!.replaceAll(RegExp(r'^[\d\s.*•-]+'), '').trim();
        final p = double.tryParse(xMatch.group(3)!) ?? 0.0;
        final tot = xMatch.group(4) != null ? (double.tryParse(xMatch.group(4)!) ?? (q * p)) : (q * p);
        if (name.isNotEmpty && !RegExp(r'^(item|description|particulars)$', caseSensitive: false).hasMatch(name)) {
          items.add(DetectedBillItem(
            name: name,
            quantity: max(1, q),
            unitPricePaise: (p * 100).round(),
            totalPaise: (tot * 100).round(),
          ));
          continue;
        }
      }

      final match = RegExp(r'^(.+?)\s+([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)(?:\s+([0-9]+(?:\.[0-9]+)?))?$').firstMatch(trimmed);
      if (match != null) {
        final name = match.group(1)!.replaceAll(RegExp(r'^[\d\s.*•-]+'), '').trim();
        if (RegExp(r'^(item|description|particulars)$', caseSensitive: false).hasMatch(name)) {
          continue;
        }
        final n1 = double.tryParse(match.group(2)!) ?? 0.0;
        final n2 = double.tryParse(match.group(3)!) ?? 0.0;
        final n3Str = match.group(4);
        final n3 = n3Str != null ? double.tryParse(n3Str) : null;

        if (n3 != null) {
          if ((n1 * n2 - n3).abs() < 0.1) {
            items.add(DetectedBillItem(name: name, quantity: n1.round(), unitPricePaise: (n2 * 100).round(), totalPaise: (n3 * 100).round()));
          } else if ((n2 * n1 - n3).abs() < 0.1) {
            items.add(DetectedBillItem(name: name, quantity: n2.round(), unitPricePaise: (n1 * 100).round(), totalPaise: (n3 * 100).round()));
          } else {
            items.add(DetectedBillItem(name: name, quantity: max(1, n1.round()), unitPricePaise: (n2 * 100).round(), totalPaise: (n3 * 100).round()));
          }
        } else {
          if (n1 > 0 && n2 > n1 && (n2 / n1 - (n2 / n1).round()).abs() < 0.05) {
            items.add(DetectedBillItem(name: name, quantity: (n2 / n1).round(), unitPricePaise: (n1 * 100).round(), totalPaise: (n2 * 100).round()));
          } else {
            items.add(DetectedBillItem(name: name, quantity: 1, unitPricePaise: (n1 * 100).round(), totalPaise: (n2 * 100).round()));
          }
        }
      }
    }
  }

  // 5. Parse totals if missing
  if (subtotal == 0 || grandTotal == 0) {
    final combined = '$description\n$rawText';
    final subMatch = RegExp(r'sub\s*total[:\s]+(?:₹|rs\.?)?\s*([0-9.]+)', caseSensitive: false).firstMatch(combined);
    if (subMatch != null) subtotal = double.tryParse(subMatch.group(1)!) ?? 0;

    final grandMatch = RegExp(r'grand\s*total[:\s]+(?:₹|rs\.?)?\s*([0-9.]+)', caseSensitive: false).firstMatch(combined);
    if (grandMatch != null) grandTotal = double.tryParse(grandMatch.group(1)!) ?? 0;

    final cgstLine = RegExp(r'cgst[^\n]*', caseSensitive: false).firstMatch(combined)?.group(0);
    if (cgstLine != null) {
      final nums = RegExp(r'[0-9]+(?:\.[0-9]+)?').allMatches(cgstLine).map((m) => double.tryParse(m.group(0)!) ?? 0).toList();
      if (nums.isNotEmpty) cgst = nums.last;
    }

    final sgstLine = RegExp(r'sgst[^\n]*', caseSensitive: false).firstMatch(combined)?.group(0);
    if (sgstLine != null) {
      final nums = RegExp(r'[0-9]+(?:\.[0-9]+)?').allMatches(sgstLine).map((m) => double.tryParse(m.group(0)!) ?? 0).toList();
      if (nums.isNotEmpty) sgst = nums.last;
    }

    final taxLine = RegExp(r'(?:total\s+)?tax[^\n]*', caseSensitive: false).firstMatch(combined)?.group(0);
    if (taxLine != null) {
      final nums = RegExp(r'[0-9]+(?:\.[0-9]+)?').allMatches(taxLine).map((m) => double.tryParse(m.group(0)!) ?? 0).toList();
      if (nums.isNotEmpty) tax = nums.last;
    }

    if (tax == 0) tax = cgst + sgst;

    if (vendor.isEmpty) {
      final cleanLines = rawText.split('\n').map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
      for (final l in cleanLines) {
        if (!RegExp(r'^(exact|raw|part|date|invoice|bill|items|#)', caseSensitive: false).hasMatch(l)) {
          vendor = l;
          break;
        }
      }
    }

    if (invoiceNumber.isEmpty) {
      final invMatch = RegExp(r'(?:invoice|bill|token)\s*[:#\s]*(?:no\.?)?[:#\s]*([a-zA-Z0-9_-]+)', caseSensitive: false).firstMatch(combined);
      if (invMatch != null) invoiceNumber = invMatch.group(1)!;
    }
  }

  return ParsedReceiptResult(
    rawText: rawText,
    vendor: vendor.isNotEmpty ? vendor : null,
    date: date.isNotEmpty ? date : null,
    invoiceNumber: invoiceNumber.isNotEmpty ? invoiceNumber : null,
    subtotalPaise: (subtotal * 100).round(),
    cgstPaise: (cgst * 100).round(),
    sgstPaise: (sgst * 100).round(),
    taxPaise: (tax * 100).round(),
    grandTotalPaise: (grandTotal * 100).round(),
    items: items,
  );
}
