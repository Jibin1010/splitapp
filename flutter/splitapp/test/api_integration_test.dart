import 'package:flutter_test/flutter_test.dart';
import 'package:splitapp/core/calculations.dart';
import 'package:splitapp/core/seed.dart';
import 'package:splitapp/models/split_types.dart';
import 'package:splitapp/services/calculate_api_service.dart';
import 'package:splitapp/services/vision_api_service.dart';

void main() {
  group('Flutter API Integration Tests (with Web App Backend)', () {
    const proxyBase = 'http://localhost:3000';

    test('POST /api/calculate succeeds and returns identical result as local engine', () async {
      final service = CalculateApiService(baseUrl: proxyBase);
      final bill = createSampleBill();

      final apiResult = await service.calculate(bill, fallbackToLocal: false);
      final localResult = calculateBill(bill);

      expect(apiResult.valid, equals(localResult.valid));
      expect(apiResult.billTotal, equals(localResult.billTotal));
      expect(apiResult.itemsTotal, equals(localResult.itemsTotal));
      expect(apiResult.adjustmentsTotal, equals(localResult.adjustmentsTotal));
      expect(apiResult.settlements.length, equals(localResult.settlements.length));

      // Check per-person shares
      for (final person in bill.people) {
        expect(apiResult.people[person.id]?.share, equals(localResult.people[person.id]?.share));
        expect(apiResult.people[person.id]?.net, equals(localResult.people[person.id]?.net));
      }
    });

    test('POST /api/calculate detects invalid bills and reports structured issues', () async {
      final service = CalculateApiService(baseUrl: proxyBase);
      final bill = createSampleBill().copyWith(
        items: [
          const ProductItem(
            id: 'unassigned-item',
            name: 'Mystery Dish',
            quantity: 1,
            unitPrice: 10000,
            allocation: Allocation(
              mode: SplitMode.equal,
              participantIds: [], // Unassigned
            ),
          )
        ],
      );

      final result = await service.calculate(bill, fallbackToLocal: false);
      expect(result.valid, isFalse);
      expect(result.issues.any((i) => i.code == IssueCode.itemUnassigned), isTrue);
    });

    test('POST /api/calculate gracefully falls back to local engine if server unreachable', () async {
      final offlineService = CalculateApiService(baseUrl: 'http://localhost:59999');
      final bill = createSampleBill();

      final result = await offlineService.calculate(bill, fallbackToLocal: true);
      expect(result.valid, isTrue);
      expect(result.billTotal, equals(246000));
    });

    test('POST /api/vision proxy correctly analyzes receipt image via Next.js backend', () async {
      final service = VisionApiService(proxyBaseUrl: proxyBase);
      const svgBill = 'data:image/svg+xml;utf8,<svg><text>Duniyav Bir</text><text>#99307 · 03/10/26</text><text>3x Chicken Biriyani 540.00</text><text>1x Meals 120.00</text><text>Total: 693.00</text></svg>';

      final response = await service.callProxyVision(
        image: svgBill,
      );

      expect(response, isNotNull);
      expect(response!.ok, isTrue);
      expect(response.vendor, equals('Duniyav Bir'));
      expect(response.grandTotalPaise, equals(69300));
      expect(response.detectedItems.length, equals(2));
      expect(response.detectedItems[0].name, equals('Chicken Biriyani'));
      expect(response.detectedItems[0].quantity, equals(3));
      expect(response.detectedItems[0].unitPricePaise, equals(18000));
    });
  });
}
