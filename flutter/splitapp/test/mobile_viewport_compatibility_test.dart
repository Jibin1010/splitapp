import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:splitapp/services/storage_service.dart';
import 'package:splitapp/services/vision_api_service.dart';
import 'package:splitapp/state/bill_state.dart';
import 'package:splitapp/theme/app_theme.dart';
import 'package:splitapp/widgets/dashboard/dashboard_screen.dart';
import 'package:splitapp/widgets/dashboard/quick_actions_sheet.dart';
import 'package:splitapp/widgets/dialogs/image_vision_dialog.dart';
import 'package:splitapp/widgets/dialogs/user_switcher_sheet.dart';

void main() {
  group('Mobile Viewport & Screen Compatibility Tests', () {
    late StorageService storage;
    late BillState state;
    late VisionApiService visionService;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      storage = await StorageService.init();
      state = BillState(storage);
      visionService = VisionApiService();
    });

    Widget buildTestApp({required Widget child}) {
      return MaterialApp(
        theme: AppTheme.darkTheme.copyWith(
          splashFactory: NoSplash.splashFactory,
        ),
        home: child,
      );
    }

    testWidgets('Dashboard renders with zero overflow on standard mobile (390x844)', (tester) async {
      tester.view.physicalSize = const Size(390 * 3, 844 * 3);
      tester.view.devicePixelRatio = 3.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        buildTestApp(
          child: DashboardScreen(
            storage: storage,
            state: state,
            visionService: visionService,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(DashboardScreen), findsOneWidget);
      expect(find.textContaining('Gross Revenue', findRichText: true), findsNothing);
      expect(tester.takeException(), isNull);
    });

    testWidgets('Dashboard renders with zero overflow on compact Android (360x740)', (tester) async {
      tester.view.physicalSize = const Size(360 * 2, 740 * 2);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        buildTestApp(
          child: DashboardScreen(
            storage: storage,
            state: state,
            visionService: visionService,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);

      // Switch to Flow tab (Tab 1)
      await tester.tap(find.byTooltip('Flow'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      // Switch to Bill & Breakdown tab (Tab 2)
      await tester.tap(find.byTooltip('Bill'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      // Switch to AI Lead tab (Tab 3)
      await tester.tap(find.byTooltip('AI Lead'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('UserSwitcherSheet renders with zero overflow on 360px mobile', (tester) async {
      tester.view.physicalSize = const Size(360 * 2, 740 * 2);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        buildTestApp(
          child: Scaffold(
            body: Builder(
              builder: (ctx) => Center(
                child: ElevatedButton(
                  onPressed: () => UserSwitcherSheet.show(ctx, state),
                  child: const Text('Open Switcher'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Switcher'));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });

    testWidgets('VisionItemAssignmentSheet renders with zero overflow on 360px mobile', (tester) async {
      tester.view.physicalSize = const Size(360 * 2, 740 * 2);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final people = state.bill.people
          .map((p) => DialogPerson(id: p.id, name: p.name, photo: p.photo))
          .toList();

      final item = EditableDetectedItem(
        id: 'test-item',
        name: 'Paneer Butter Masala',
        quantity: 2,
        unitPricePaise: 24000,
        totalPaise: 48000,
        assignedParticipantIds: [people.first.id],
      );

      await tester.pumpWidget(
        buildTestApp(
          child: Scaffold(
            body: Builder(
              builder: (ctx) => Center(
                child: ElevatedButton(
                  onPressed: () => VisionItemAssignmentSheet.show(
                    context: ctx,
                    item: item,
                    people: people,
                    onAssignedChanged: (_) {},
                  ),
                  child: const Text('Open Assign'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Assign'));
      await tester.pumpAndSettle();

      expect(find.text('Assign Participants'), findsOneWidget);
      expect(find.text('Paneer Butter Masala'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('QuickActionsSheet renders without overflow on 360px mobile', (tester) async {
      tester.view.physicalSize = const Size(360 * 2, 740 * 2);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        buildTestApp(
          child: Scaffold(
            body: Builder(
              builder: (ctx) => Center(
                child: ElevatedButton(
                  onPressed: () => showQuickActionsSheet(
                    context: ctx,
                    state: state,
                    onOpenVision: () {},
                    onSwitchTab: (_) {},
                  ),
                  child: const Text('Open Actions'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Actions'));
      await tester.pumpAndSettle();

      expect(find.text('QUICK ACTIONS'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
