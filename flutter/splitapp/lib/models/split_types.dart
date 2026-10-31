/// Core domain types for SplitLedger in Flutter.
///
/// All monetary amounts are stored as integers in the smallest currency unit
/// ("paise" for INR — 1 rupee = 100 paise; cents for USD/EUR/GBP).
/// Never use floating point for money arithmetic.
library;

export 'currency_models.dart';
export 'allocation_models.dart';
export 'adjustment_models.dart';
export 'settlement_models.dart';
export 'bill_models.dart';
