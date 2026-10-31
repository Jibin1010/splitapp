import 'package:flutter/material.dart';
import '../../services/storage_service.dart';
import '../../services/vision_api_service.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import 'ai_operations_lead.dart';
import 'bill_split_breakdown.dart';
import 'integrations_card.dart';
import 'people_panel.dart';
import 'products_table.dart';
import 'quick_actions_sheet.dart';
import 'revenue_overview_card.dart';
import 'settlement_preview.dart';
import 'user_perspective_bar.dart';
import 'venue_capacity_card.dart';
import '../dialogs/history_dialog.dart';
import '../dialogs/image_vision_dialog.dart';
import '../dialogs/settings_dialog.dart';
import '../layout/tubik_bottom_nav.dart';
import '../layout/tubik_header.dart';

class DashboardScreen extends StatefulWidget {
  final StorageService storage;
  final BillState state;
  final VisionApiService visionService;

  const DashboardScreen({
    super.key,
    required this.storage,
    required this.state,
    required this.visionService,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentTab = 1; // Start on 1: Settlement Flow & Map

  void _openHistory() {
    showDialog(
      context: context,
      builder: (ctx) => HistoryDialog(
        storage: widget.storage,
        state: widget.state,
      ),
    );
  }

  void _openSettings() {
    showDialog(
      context: context,
      builder: (ctx) => SettingsDialog(state: widget.state),
    );
  }

  void _openVision() {
    showDialog(
      context: context,
      builder: (ctx) => ImageVisionDialog(
        state: widget.state,
        visionService: widget.visionService,
      ),
    );
  }

  void _openHeadPayersReconciliation() {
    setState(() => _currentTab = 1);
  }

  void _openBreakdownTab() {
    setState(() => _currentTab = 2);
  }

  void _openAddOptions() {
    showQuickActionsSheet(
      context: context,
      state: widget.state,
      onOpenVision: _openVision,
      onSwitchTab: (tabIndex) => setState(() => _currentTab = tabIndex),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.state,
      builder: (context, _) {
        return Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: Column(
              children: [
                // Fixed Header Bar
                Padding(
                  padding: const EdgeInsets.only(
                      left: 18, right: 18, top: 12, bottom: 4),
                  child: TubikAppHeader(
                    state: widget.state,
                    onOpenAiLead: () => setState(() => _currentTab = 3),
                    onOpenSettings: _openSettings,
                    onOpenHistory: _openHistory,
                  ),
                ),

                // Multi-Login Perspective Quick-Switcher Bar
                UserPerspectiveBar(state: widget.state),
                const SizedBox(height: 4),

                // Main Content Switching by Active Tab
                Expanded(
                  child: IndexedStack(
                    index: _currentTab,
                    children: [
                      // TAB 0: HOME / OPERATIONS OVERVIEW
                      SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            PersonalSpotlightCard(
                              state: widget.state,
                              onOpenBreakdown: _openBreakdownTab,
                            ),
                            const SizedBox(height: 16),
                            SettlementPreview(state: widget.state),
                            const SizedBox(height: 16),
                            RevenueOverviewCard(
                              state: widget.state,
                              onOpenHeadPayers: _openHeadPayersReconciliation,
                            ),
                            const SizedBox(height: 16),
                            VenueCapacityCard(state: widget.state),
                            const SizedBox(height: 16),
                            const IntegrationsCard(),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),

                      // TAB 1: SETTLEMENT FLOW & MULTI-PAYER GRAPH
                      SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            SettlementPreview(state: widget.state),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),

                      // TAB 2: BILL & BREAKDOWN
                      SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            BillSplitBreakdownWidget(state: widget.state),
                            const SizedBox(height: 16),
                            ProductsTable(
                              state: widget.state,
                              onOpenVision: _openVision,
                            ),
                            const SizedBox(height: 16),
                            PeoplePanel(state: widget.state),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),

                      // TAB 3: AI OPERATIONS LEAD
                      AiOperationsLeadWidget(
                        state: widget.state,
                        onScanBill: _openVision,
                        onOpenHeadPayers: _openHeadPayersReconciliation,
                        onOpenBreakdown: _openBreakdownTab,
                      ),
                    ],
                  ),
                ),

                // Floating Bottom Pill Navigation Bar
                TubikBottomNav(
                  currentIndex: _currentTab,
                  onTabSelected: (index) =>
                      setState(() => _currentTab = index),
                  onAddAction: _openAddOptions,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
