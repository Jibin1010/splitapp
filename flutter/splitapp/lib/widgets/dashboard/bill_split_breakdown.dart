import 'package:flutter/material.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import 'breakdown_participant_card.dart';
import 'breakdown_share_helper.dart';
import 'breakdown_summary_strip.dart';
import 'breakdown_table_view.dart';

export 'breakdown_participant_card.dart';
export 'breakdown_share_helper.dart';
export 'breakdown_summary_strip.dart';
export 'breakdown_table_view.dart';

/// Minimal Bill & GST Split Breakdown in Tubik UI Theme
/// Ported directly from today's Next.js component `bill-split-breakdown.tsx`
class BillSplitBreakdownWidget extends StatefulWidget {
  final BillState state;

  const BillSplitBreakdownWidget({super.key, required this.state});

  @override
  State<BillSplitBreakdownWidget> createState() =>
      _BillSplitBreakdownWidgetState();
}

class _BillSplitBreakdownWidgetState extends State<BillSplitBreakdownWidget> {
  bool _copied = false;
  bool _isTableView = false;

  void _copySummary(BuildContext context) async {
    await copyBreakdownSummaryToClipboard(
      context,
      bill: widget.state.bill,
      preview: widget.state.preview,
    );
    if (!mounted) return;
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final bill = widget.state.bill;
    final preview = widget.state.preview;
    final currency = bill.currency;

    if (bill.people.isEmpty || bill.items.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.border, width: 1.2),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header bar: Vendor / Title, Date, Invoice & Action
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 10,
            runSpacing: 10,
            children: [
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 280),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Center(
                        child: Icon(Icons.receipt_long_rounded,
                            size: 18, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                bill.name.isEmpty
                                    ? 'Bill Breakdown'
                                    : bill.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (bill.vendor != null &&
                                  bill.vendor!.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceElevated,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    bill.vendor!,
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${bill.date ?? 'Today'} ${bill.invoiceNumber != null ? '• #${bill.invoiceNumber}' : ''}',
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // View Mode Toggle (Cards vs Table)
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: Icon(
                            Icons.grid_view_rounded,
                            size: 14,
                            color: !_isTableView ? AppColors.mintSage : AppColors.textMuted,
                          ),
                          onPressed: () => setState(() => _isTableView = false),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          constraints: const BoxConstraints(),
                          tooltip: 'Cards view',
                        ),
                        IconButton(
                          icon: Icon(
                            Icons.table_chart_rounded,
                            size: 14,
                            color: _isTableView ? AppColors.mintSage : AppColors.textMuted,
                          ),
                          onPressed: () => setState(() => _isTableView = true),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          constraints: const BoxConstraints(),
                          tooltip: 'Table audit view',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),

                  // WhatsApp / Copy Button
                  GestureDetector(
                    onTap: () => _copySummary(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: _copied ? AppColors.mintSage : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _copied ? AppColors.mintSage : AppColors.border,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _copied ? Icons.check_rounded : Icons.copy_rounded,
                            size: 13,
                            color: _copied ? Colors.black : Colors.white,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _copied ? 'Copied' : 'Share',
                            style: TextStyle(
                              color: _copied ? Colors.black : Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Financial Summary Strip (Subtotal + Taxes = Total)
          BreakdownSummaryStrip(preview: preview, currency: currency),

          const SizedBox(height: 14),

          // Per-Participant Itemized Share (Cards view vs Table view)
          if (_isTableView)
            BreakdownTableView(
              bill: bill,
              preview: preview,
              activePerson: widget.state.activePerson,
              onSelectPerson: (p) => widget.state.setActivePerson(p.id),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: bill.people.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final person = bill.people[index];
                final active = widget.state.activePerson;
                final isActive = active != null && active.id == person.id;
                final pRes = preview.people[person.id];
                final share = pRes?.share ?? 0;
                final net = pRes?.net ?? 0;

                return BreakdownParticipantCard(
                  person: person,
                  isActive: isActive,
                  share: share,
                  net: net,
                  currency: currency,
                );
              },
            ),
        ],
      ),
    );
  }
}
