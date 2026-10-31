import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:splitapp/core/calculations.dart';
import 'package:splitapp/core/dummy_people.dart';
import 'package:splitapp/core/money.dart';
import 'package:splitapp/core/seed.dart';
import 'package:splitapp/main.dart';
import 'package:splitapp/models/split_types.dart';
import 'package:splitapp/services/storage_service.dart';
import 'package:splitapp/services/vision_api_service.dart';
import 'package:splitapp/state/bill_state.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('Money calculations test', () {
    expect(parseAmount('12.50'), 1250);
    expect(parseAmount('100'), 10000);
    expect(formatMoney(1250, CurrencyCode.inr), '₹12.50');
    expect(formatMoney(10000, CurrencyCode.usd), '\$100.00');

    final dist = distributeEvenly(100, 3);
    expect(dist.reduce((a, b) => a + b), 100);
    expect(dist, [34, 33, 33]);
  });

  test('Calculation engine with sample bill', () {
    final bill = createSampleBill();
    final result = calculateBill(bill);
    expect(result.valid, isTrue);
    expect(result.issues.isEmpty, isTrue);
    expect(result.settlements.isNotEmpty, isTrue);
  });

  test('50 dummy people preset generation', () {
    final people = get50DummyPeople();
    expect(people.length, 50);
    final bill50 = create50PeopleBill();
    expect(bill50.people.length, 50);
    expect(bill50.name, 'Group Split');
  });

  testWidgets('SplitLedgerApp smoke test', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    final storage = await StorageService.init();
    final billState = BillState(storage);
    final visionService = VisionApiService();

    await tester.pumpWidget(SplitLedgerApp(
      storage: storage,
      billState: billState,
      visionService: visionService,
    ));
    await tester.pumpAndSettle();
    expect(find.byType(SplitLedgerApp), findsOneWidget);
  });

  test('Multi-login profile switching and item highlighting logic test', () async {
    final storage = await StorageService.init();
    final billState = BillState(storage);

    // Initial state check - default active person is first person
    expect(billState.activePerson, isNotNull);
    final firstPersonId = billState.bill.people.first.id;
    final secondPersonId = billState.bill.people[1].id;
    expect(billState.activePersonId, firstPersonId);

    // Switch profile to second person
    billState.setActivePerson(secondPersonId);
    expect(billState.activePersonId, secondPersonId);
    expect(billState.activePerson?.id, secondPersonId);
    expect(billState.activePersonResult, isNotNull);

    // Verify per-item portion calculations for active person
    final item = billState.bill.items.first;
    final share = billState.getItemShareForActivePerson(item.id);
    expect(share, isNonNegative);

    // Add new person with auto-switch
    billState.addPerson('New Guest', switchTo: true);
    expect(billState.activePerson?.name, 'New Guest');
  });

  testWidgets('User perspective switcher renders and switches perspective', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    final storage = await StorageService.init();
    final billState = BillState(storage);
    final visionService = VisionApiService();

    await tester.pumpWidget(SplitLedgerApp(
      storage: storage,
      billState: billState,
      visionService: visionService,
    ));
    await tester.pumpAndSettle();

    // Verify 'View as:' switcher bar is visible
    expect(find.text('View as:'), findsOneWidget);

    // Tap on second person's chip in switcher
    final secondPersonName = billState.bill.people[1].name;
    final secondChip = find.text(secondPersonName);
    expect(secondChip, findsWidgets);
    await tester.tap(secondChip.first);
    await tester.pumpAndSettle();

    // Perspective should now be the second person
    expect(billState.activePerson?.name, secondPersonName);
  });
}
