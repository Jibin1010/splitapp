import 'package:flutter/material.dart';
import 'services/storage_service.dart';
import 'services/vision_api_service.dart';
import 'state/bill_state.dart';
import 'theme/app_theme.dart';
import 'widgets/dashboard/dashboard_screen.dart';

export 'widgets/dashboard/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storage = await StorageService.init();
  final billState = BillState(storage);
  final visionService = VisionApiService();

  runApp(SplitLedgerApp(
    storage: storage,
    billState: billState,
    visionService: visionService,
  ));
}

class SplitLedgerApp extends StatelessWidget {
  final StorageService storage;
  final BillState billState;
  final VisionApiService visionService;

  const SplitLedgerApp({
    super.key,
    required this.storage,
    required this.billState,
    required this.visionService,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'The Daily Grind — AI Restaurant Operations & Split',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: DashboardScreen(
        storage: storage,
        state: billState,
        visionService: visionService,
      ),
    );
  }
}
