import 'package:intl/intl.dart';
import '../models/split_types.dart';

/// Maximum safe integer for money calculations.
const int maxMoney = 4503599627370495; // (2^53 - 1) ~/ 2

/// Parse a user-entered amount into integer paise.
/// Accepts forms like "450", "450.00", "450.5", "1,234.50", "₹450".
/// Returns null when the input cannot be interpreted as an amount.
int? parseAmount(dynamic input) {
  if (input == null) return null;
  if (input is num) {
    if (!input.isFinite) return null;
    final paise = (input * 100).round();
    return paise.abs() <= maxMoney ? paise : null;
  }
  final str = input.toString().trim();
  final cleaned = str.replaceAll(RegExp(r'[₹$€£,\s]'), '');
  if (cleaned.isEmpty) return null;
  if (cleaned == '-' || cleaned == '+') return null;
  if (!RegExp(r'^[+-]?\d*(?:\.\d*)?$').hasMatch(cleaned)) return null;

  final value = double.tryParse(cleaned);
  if (value == null || !value.isFinite) return null;
  final paise = (value * 100).round();
  if (paise.abs() > maxMoney) return null;
  return paise;
}

/// Format paise as a currency string, e.g. 246000 -> "₹2,460.00".
String formatMoney(int paise, [CurrencyCode currency = CurrencyCode.inr]) {
  final meta = currencyMetaMap[currency] ?? currencyMetaMap[CurrencyCode.inr]!;
  final absVal = (paise.abs() / 100.0);
  final formatter = NumberFormat.currency(
    locale: meta.locale,
    symbol: '',
    decimalDigits: 2,
  );
  final formatted = formatter.format(absVal).trim();
  final sign = paise < 0 ? '-' : '';
  return '$sign${meta.symbol}$formatted';
}

/// Plain decimal string for inputs, e.g. 45000 -> "450.00".
String amountToInputString(int paise) {
  return ((paise < 0 ? -paise : paise) / 100.0).toStringAsFixed(2);
}

/// Split an integer amount as evenly as possible across `parts` buckets.
/// The first (total % parts) buckets receive one extra unit, so the result
/// always sums to exactly `total` — no paisa is ever lost.
List<int> distributeEvenly(int total, int parts) {
  if (parts <= 0) return [];
  final base = total ~/ parts;
  final remainder = total - (base * parts);
  return List.generate(parts, (i) => base + (i < remainder ? 1 : 0));
}

class _FracOrder {
  final int index;
  final double frac;
  final double weight;
  _FracOrder({required this.index, required this.frac, required this.weight});
}

/// Allocate `total` across buckets proportionally to `weights`
/// using the largest-remainder method. Ties break toward the lower index,
/// so results are fully deterministic and sum to exactly `total`.
List<int> allocateProportionally(int total, List<num> weights) {
  final n = weights.length;
  if (n == 0) return [];
  final clamped = weights.map((w) => (w.isFinite && w > 0) ? w.toDouble() : 0.0).toList();
  final weightSum = clamped.fold<double>(0.0, (a, b) => a + b);
  if (weightSum == 0) {
    if (total == 0) return List.filled(n, 0);
    throw ArgumentError('Cannot allocate a non-zero amount across zero total weight.');
  }

  final exact = clamped.map((w) => (total * w) / weightSum).toList();
  final floors = exact.map((x) => x.floor()).toList();
  int remainder = total - floors.fold<int>(0, (a, b) => a + b);

  // Order by largest fractional part, ties by lower index (deterministic).
  final order = List<_FracOrder>.generate(
    n,
    (i) => _FracOrder(
      index: i,
      frac: exact[i] - exact[i].floor(),
      weight: clamped[i],
    ),
  );
  order.sort((a, b) {
    final diff = b.frac.compareTo(a.frac);
    if (diff != 0) return diff;
    return a.index.compareTo(b.index);
  });

  final result = List<int>.from(floors);
  for (final item in order) {
    if (remainder <= 0) break;
    if (item.weight <= 0) continue;
    result[item.index] += 1;
    remainder -= 1;
  }

  if (remainder != 0) {
    throw StateError('Money integrity violation: $remainder units could not be allocated.');
  }
  return result;
}
