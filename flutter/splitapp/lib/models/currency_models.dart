/// Currency models and metadata for SplitLedger.
library;

enum CurrencyCode { inr, usd, eur, gbp }

extension CurrencyCodeExtension on CurrencyCode {
  String get code {
    switch (this) {
      case CurrencyCode.inr:
        return 'INR';
      case CurrencyCode.usd:
        return 'USD';
      case CurrencyCode.eur:
        return 'EUR';
      case CurrencyCode.gbp:
        return 'GBP';
    }
  }

  static CurrencyCode fromString(String str) {
    switch (str.toUpperCase()) {
      case 'USD':
        return CurrencyCode.usd;
      case 'EUR':
        return CurrencyCode.eur;
      case 'GBP':
        return CurrencyCode.gbp;
      case 'INR':
      default:
        return CurrencyCode.inr;
    }
  }
}

class CurrencyMeta {
  final String symbol;
  final String locale;
  final String label;

  const CurrencyMeta({
    required this.symbol,
    required this.locale,
    required this.label,
  });
}

const Map<CurrencyCode, CurrencyMeta> currencyMetaMap = {
  CurrencyCode.inr: CurrencyMeta(
    symbol: '₹',
    locale: 'en_IN',
    label: 'Indian Rupee (₹)',
  ),
  CurrencyCode.usd: CurrencyMeta(
    symbol: '\$',
    locale: 'en_US',
    label: 'US Dollar (\$)',
  ),
  CurrencyCode.eur: CurrencyMeta(
    symbol: '€',
    locale: 'de_DE',
    label: 'Euro (€)',
  ),
  CurrencyCode.gbp: CurrencyMeta(
    symbol: '£',
    locale: 'en_GB',
    label: 'British Pound (£)',
  ),
};
