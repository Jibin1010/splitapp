import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import 'reconciliation_alert_card.dart';
import 'revenue_user_banner.dart';
import 'revenue_week_chart.dart';

export 'reconciliation_alert_card.dart';
export 'revenue_user_banner.dart';
export 'revenue_week_chart.dart';

/// Tubik Style Coral Revenue & Alert Card
/// Derived directly from Screen 4 "REVENUE" and Center "STABILIZING LABOR COST"
class RevenueOverviewCard extends StatefulWidget {
  final BillState state;
  final VoidCallback onOpenHeadPayers;

  const RevenueOverviewCard({
    super.key,
    required this.state,
    required this.onOpenHeadPayers,
  });

  @override
  State<RevenueOverviewCard> createState() => _RevenueOverviewCardState();
}

class _RevenueOverviewCardState extends State<RevenueOverviewCard> {
  int _selectedDayIndex = 1; // Tuesday by default, matching Dribbble shot

  final List<Map<String, dynamic>> _weekDays = [
    {'day': 'Mon', 'height': 0.45, 'value': 14200.0},
    {'day': 'Tue', 'height': 0.85, 'value': 21150.88},
    {'day': 'Wen', 'height': 0.60, 'value': 16400.0},
    {'day': 'Thu', 'height': 0.72, 'value': 18900.0},
    {'day': 'Fri', 'height': 0.95, 'value': 24500.0},
    {'day': 'Sat', 'height': 0.80, 'value': 22300.0},
    {'day': 'Sun', 'height': 0.50, 'value': 15800.0},
  ];

  @override
  Widget build(BuildContext context) {
    final bill = widget.state.bill;
    final preview = widget.state.preview;
    final currency = bill.currency;
    final totalPaid = bill.people.fold<int>(0, (sum, p) => sum + p.paidAmount);
    final billTotal = preview.billTotal;
    final isBalanced = totalPaid == billTotal && billTotal > 0;
    final headPayersCount = bill.people.where((p) => p.paidAmount > 0).length;

    final avgPerPerson = bill.people.isNotEmpty
        ? (billTotal / bill.people.length).round()
        : 0;

    final active = widget.state.activePerson;
    final activeRes = widget.state.activePersonResult;
    final activeShare = activeRes?.share ?? 0;
    final activePaid = active?.paidAmount ?? 0;
    final activePercent =
        billTotal > 0 ? (activeShare / billTotal * 100) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ==============================================================
        // 1. CORAL GRADIENT REVENUE CARD (TUBIK SHOT SCREEN 4)
        // ==============================================================
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: AppColors.coralGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.coral.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top label & Growth badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'GROSS REVENUE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Text(
                      '+7.5%',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Giant Total Price Typography
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  formatMoney(billTotal, currency),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1.0,
                    height: 1.1,
                  ),
                ),
              ),

              // Active user personal highlight banner inside revenue card
              if (active != null) ...[
                const SizedBox(height: 10),
                RevenueUserBanner(
                  active: active,
                  activeShare: activeShare,
                  activePaid: activePaid,
                  activePercent: activePercent,
                  currency: currency,
                ),
              ],

              const SizedBox(height: 16),

              // Sub-metric: Average Value / Per Person
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.end,
                spacing: 8,
                runSpacing: 8,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          const Text(
                            'AVG. PER PERSON',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              '+2.4%',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Text(
                            formatMoney(avgPerPerson, currency),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            '${bill.people.length} participants',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.75),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // Selected Day Tooltip Pill
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Text(
                      '${currencyMetaMap[currency]?.symbol ?? '\$'}${_weekDays[_selectedDayIndex]['value'].toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Interactive Bar Chart Columns
              RevenueWeekChart(
                weekDays: _weekDays,
                selectedDayIndex: _selectedDayIndex,
                onSelectDay: (index) =>
                    setState(() => _selectedDayIndex = index),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // ==============================================================
        // 2. DARK ALERT & RECONCILIATION CARD (TUBIK SHOT CENTER)
        // ==============================================================
        ReconciliationAlertCard(
          isBalanced: isBalanced,
          headPayersCount: headPayersCount,
          totalPaid: totalPaid,
          billTotal: billTotal,
          currency: currency,
          onTap: widget.onOpenHeadPayers,
        ),
      ],
    );
  }
}
