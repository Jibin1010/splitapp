import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:splitapp/core/dummy_people.dart';
import 'package:splitapp/models/split_types.dart';
import 'package:splitapp/services/storage_service.dart';
import 'package:splitapp/state/bill_state.dart';
import 'package:splitapp/widgets/dashboard/bill_split_breakdown.dart';
import 'package:splitapp/widgets/dashboard/summary_cards.dart';
import 'package:splitapp/widgets/dialogs/vision/vision_dialog_models.dart';
import 'package:splitapp/widgets/dialogs/vision/vision_item_assignment_sheet.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Vision Workflow & Web Features Tests', () {
    test('Dummy people search suggestions works correctly', () {
      final results = searchPeopleSuggestions('Priya');
      expect(results.any((p) => p.name.contains('Priya')), isTrue);

      final excludedResults = searchPeopleSuggestions('Priya', ['Priya Nair']);
      expect(excludedResults.any((p) => p.name == 'Priya Nair'), isFalse);
    });

    test('importAnalysisResult sets items, adjustments, and head payers atomically', () async {
      final storage = await StorageService.init();
      final state = BillState(storage);
      final p1 = Person(id: 'p1', name: 'Alok');
      final p2 = Person(id: 'p2', name: 'Priya');

      final item1 = ProductItem(
        id: 'i1',
        name: 'Chicken Biryani',
        quantity: 2,
        unitPrice: 25000,
        allocation: Allocation.equal(['p1', 'p2']),
      );

      final adj = Adjustment(
        id: 'adj1',
        label: 'GST',
        kind: AdjustmentKind.tax,
        method: AdjustmentMethod.fixed,
        value: 2500,
        shares: {'p1': 50.0, 'p2': 50.0},
      );

      state.importAnalysisResult(
        items: [item1],
        people: [p1, p2],
        adjustments: [adj],
        headPayers: {'p1': 52500},
        billName: 'Paradise Biryani',
        date: '2026-10-22',
        invoiceNumber: 'INV-9901',
        replaceExistingPeople: true,
      );

      expect(state.bill.name, equals('Paradise Biryani'));
      expect(state.bill.items.length, equals(1));
      expect(state.bill.items.first.name, equals('Chicken Biryani'));
      expect(state.bill.people.length, equals(2));
      expect(state.bill.people.first.paidAmount, equals(52500));
      expect(state.bill.adjustments.length, equals(1));
      expect(state.bill.adjustments.first.shares?['p1'], equals(50.0));
      expect(state.preview.billTotal, equals(52500));
      expect(state.preview.people['p1']?.net, greaterThan(0));

      state.dispose();
    });

    testWidgets('VisionItemAssignmentSheet toggles participants', (tester) async {
      List<String> assigned = ['p1'];
      final item = EditableDetectedItem(
        id: 'item1',
        name: 'Paneer Butter Masala',
        quantity: 1,
        unitPricePaise: 22000,
        totalPaise: 22000,
        assignedParticipantIds: assigned,
      );
      final people = [
        const DialogPerson(id: 'p1', name: 'Alok'),
        const DialogPerson(id: 'p2', name: 'Priya'),
      ];

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(splashFactory: NoSplash.splashFactory),
          home: Scaffold(
            body: VisionItemAssignmentSheet(
              item: item,
              people: people,
              onAssignedChanged: (updated) => assigned = updated,
            ),
          ),
        ),
      );

      expect(find.text('Assign Participants'), findsOneWidget);
      expect(find.text('Paneer Butter Masala'), findsOneWidget);
      expect(find.text('Alok'), findsOneWidget);
      expect(find.text('Priya'), findsOneWidget);

      await tester.tap(find.text('Priya'));
      await tester.pumpAndSettle();

      expect(assigned.contains('p2'), isTrue);
    });

    testWidgets('BreakdownTableView renders participant shares accurately', (tester) async {
      tester.view.physicalSize = const Size(1400, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final storage = await StorageService.init();
      final state = BillState(storage);
      final p1 = Person(id: 'p1', name: 'Alok', paidAmount: 30000);
      final p2 = Person(id: 'p2', name: 'Priya', paidAmount: 0);

      final item = ProductItem(
        id: 'i1',
        name: 'Veg Meals',
        quantity: 2,
        unitPrice: 15000,
        allocation: Allocation.equal(['p1', 'p2']),
      );

      state.importAnalysisResult(
        items: [item],
        people: [p1, p2],
        adjustments: [],
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(splashFactory: NoSplash.splashFactory),
          home: Scaffold(
            body: SingleChildScrollView(
              child: BreakdownTableView(
                bill: state.bill,
                preview: state.preview,
                activePerson: p1,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('PARTICIPANT'), findsOneWidget);
      expect(find.text('Alok'), findsOneWidget);
      expect(find.text('Priya'), findsOneWidget);
      expect(find.text('YOU'), findsOneWidget);

      await tester.pump(const Duration(milliseconds: 700));
      state.dispose();
    });

    testWidgets('BillSplitBreakdown switches between cards view and table audit view', (tester) async {
      tester.view.physicalSize = const Size(1400, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final storage = await StorageService.init();
      final state = BillState(storage);
      final p1 = Person(id: 'p1', name: 'Alok', paidAmount: 20000);
      final p2 = Person(id: 'p2', name: 'Priya', paidAmount: 0);
      final item = ProductItem(
        id: 'i1',
        name: 'Masala Dosa',
        quantity: 2,
        unitPrice: 10000,
        allocation: Allocation.equal(['p1', 'p2']),
      );

      state.importAnalysisResult(
        items: [item],
        people: [p1, p2],
        adjustments: [],
        billName: 'South Indian Breakfast',
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(splashFactory: NoSplash.splashFactory),
          home: Scaffold(
            body: SingleChildScrollView(
              child: BillSplitBreakdownWidget(state: state),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('South Indian Breakfast'), findsOneWidget);
      expect(find.byTooltip('Cards view'), findsOneWidget);
      expect(find.byTooltip('Table audit view'), findsOneWidget);

      await tester.tap(find.byTooltip('Table audit view'));
      await tester.pumpAndSettle();

      expect(find.byType(BreakdownTableView), findsOneWidget);
      expect(find.text('PARTICIPANT'), findsOneWidget);

      await tester.pump(const Duration(milliseconds: 700));
      state.dispose();
    });

    testWidgets('SummaryCards renders active user share', (tester) async {
      final storage = await StorageService.init();
      final state = BillState(storage);
      final p1 = Person(id: 'p1', name: 'Alok', paidAmount: 50000);
      final item = ProductItem(
        id: 'i1',
        name: 'Grand Buffet',
        quantity: 1,
        unitPrice: 50000,
        allocation: Allocation.equal(['p1']),
      );

      state.importAnalysisResult(
        items: [item],
        people: [p1],
        adjustments: [],
      );

      state.setActivePerson(p1.id);

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(splashFactory: NoSplash.splashFactory),
          home: Scaffold(
            body: SummaryCards(state: state),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('BILL TOTAL (INCL. GST)'), findsOneWidget);
      expect(find.text('PARTICIPANTS'), findsOneWidget);
      expect(find.text('PRODUCTS'), findsOneWidget);
      expect(find.text('UNASSIGNED'), findsOneWidget);

      await tester.pump(const Duration(milliseconds: 700));
      state.dispose();
    });
  });
}
