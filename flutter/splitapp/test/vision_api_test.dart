import 'package:flutter_test/flutter_test.dart';
import 'package:splitapp/core/vision_parser.dart';
import 'package:splitapp/services/vision_api_service.dart';

void main() {
  group('VisionApiService & Parser End-to-End Tests', () {
    test('parseReceiptResponse extracts vendor, products, prices, and taxes correctly', () {
      const mockRawText = '''
Exact Raw Text First:
PARADISE FOOD COURT
123 Hyderabad Road
Date: 2026-10-22
Invoice: #INV-4821

Items:
2x Chicken Dum Biryani @ 350.00 = 700.00
1x Paneer Tikka @ 250.00 = 250.00
1x Garlic Naan @ 60.00 = 60.00

Subtotal: 1010.00
CGST 2.5%: 25.25
SGST 2.5%: 25.25
Total Tax: 50.50
Grand Total: 1060.50
''';

      final res = parseReceiptResponse(mockRawText);

      expect(res.items.length, equals(3));
      expect(res.items[0].name.toLowerCase(), contains('biryani'));
      expect(res.items[0].quantity, equals(2));
      expect(res.items[0].unitPricePaise, equals(35000));
      expect(res.items[0].totalPaise, equals(70000));

      expect(res.items[1].name.toLowerCase(), contains('paneer'));
      expect(res.items[1].unitPricePaise, equals(25000));

      expect(res.taxPaise, equals(5050));
      expect(res.grandTotalPaise, equals(106050));
      expect(res.vendor?.toLowerCase(), contains('paradise'));
      expect(res.invoiceNumber, equals('INV-4821'));
    });

    test('getSmartFallbackAnalysis returns structured items with valid totals', () {
      final fallback = getSmartFallbackAnalysis(preferredModel: 'google/diffusiongemma-26b-a4b-it');

      expect(fallback.ok, isTrue);
      expect(fallback.detectedItems.isNotEmpty, isTrue);
      expect(fallback.vendor, isNotNull);
      expect(fallback.grandTotalPaise, greaterThan(0));
      expect(fallback.fallbackUsed, isTrue);
    });

    test(
      'analyzeReceipt connects to live NVIDIA NIM API and receives vision description',
      () async {
        final service = VisionApiService();
        const mock1x1Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        final response = await service.analyzeReceipt(
          imageBase64OrUrl: mock1x1Png,
          requestedModel: 'meta/llama-3.2-11b-vision-instruct',
        );

        expect(response.description, isNotNull);
        expect(response.description?.isNotEmpty, isTrue);
        expect(response.durationMs, greaterThan(0));
      },
      timeout: const Timeout(Duration(seconds: 120)),
    );
  });
}
