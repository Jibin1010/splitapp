import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import '../common/app_badge.dart';
import 'split_person_summary_tile.dart';
import 'split_summary_banners.dart';

export 'split_person_summary_tile.dart';
export 'split_summary_banners.dart';

class SplitSummary extends StatelessWidget {
  final BillState state;

  const SplitSummary({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final bill = state.bill;
    final result = state.result;
    final liveIssues = state.preview.issues;

    Widget badge;
    if (result != null) {
      if (state.resultIsStale) {
        badge = const AppBadge(
          variant: BadgeVariant.warning,
          icon: Icon(Icons.refresh_rounded, size: 12),
          label: 'Recalculate',
        );
      } else {
        badge = const AppBadge(
          variant: BadgeVariant.success,
          label: 'Calculated',
        );
      }
    } else {
      badge = const AppBadge(
        variant: BadgeVariant.secondary,
        icon: Icon(Icons.schedule_rounded, size: 12),
        label: 'Awaiting calculation',
      );
    }

    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: true,
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: const Icon(Icons.checklist_rounded,
              size: 18, color: AppColors.primaryLight),
          title: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 6,
            runSpacing: 4,
            children: [
              const Text(
                'Split summary',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              badge,
            ],
          ),
          children: [
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'What each person owes for the products they shared.',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 10),

                  // Loading
                  if (state.calculating) ...[
                    const Row(
                      children: [
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.primary),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Calculating shares…',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Calculation Error Banner
                  if (state.errorMessage != null) ...[
                    SplitCalculationErrorBanner(
                      errorMessage: state.errorMessage!,
                      errorIssues: state.errorIssues,
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Live Blocker Issues
                  if (result == null &&
                      !state.calculating &&
                      liveIssues.isNotEmpty) ...[
                    SplitLiveBlockersBanner(liveIssues: liveIssues),
                  ],

                  // Awaiting Prompt
                  if (result == null &&
                      !state.calculating &&
                      liveIssues.isEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color:
                            AppColors.surfaceElevated.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Text(
                        'Awaiting calculation — press “Calculate final split” below once every product is assigned and the bill payment is recorded.',
                        style: TextStyle(
                            fontSize: 12, color: AppColors.textMuted),
                      ),
                    ),
                  ],

                  // Calculated Participants List
                  if (result != null && bill.people.isNotEmpty) ...[
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: bill.people.length,
                      separatorBuilder: (ctx, i) => const Divider(height: 1),
                      itemBuilder: (ctx, index) {
                        return SplitPersonSummaryTile(
                          bill: bill,
                          result: result,
                          person: bill.people[index],
                        );
                      },
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Shares add up to ${formatMoney(result.billTotal, bill.currency)} — exactly the bill total.',
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.textMuted),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
