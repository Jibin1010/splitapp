import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../state/bill_state.dart';
import 'settlement/settlement_audit_table.dart';
import 'settlement/settlement_graph_view.dart';
import 'settlement/settlement_head_payers_sheet.dart';

export 'settlement/settlement_audit_table.dart';
export 'settlement/settlement_export_helper.dart';
export 'settlement/settlement_graph_view.dart';
export 'settlement/settlement_head_payers_sheet.dart';
export 'settlement/settlement_transfer_card.dart';

/// Settlement Preview Card matching Screenshots 1, 2, and 3
/// Styled in Deep Midnight Dark Tubik Aesthetics
class SettlementPreview extends StatefulWidget {
  final BillState state;

  const SettlementPreview({super.key, required this.state});

  @override
  State<SettlementPreview> createState() => _SettlementPreviewState();
}

class _SettlementPreviewState extends State<SettlementPreview> {
  bool _isGraphView = true;

  void _openHeadPayersSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF141926),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => HeadPayersSetupSheet(state: widget.state),
    );
  }

  void _showBillDetailsSheet(BuildContext context) {
    final bill = widget.state.bill;
    final activeResult = widget.state.result ?? widget.state.preview;
    final currency = bill.currency;

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF141926),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Bill Details & Summary',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF94A3B8)),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(color: Color(0xFF222B3D)),
              const SizedBox(height: 8),
              for (final item in bill.items)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${item.quantity}x ${item.name}',
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                      Text(
                        formatMoney(item.quantity * item.unitPrice, currency),
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 8),
              for (final adj in bill.adjustments)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        adj.label,
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      ),
                      Text(
                        formatMoney(adj.value.toInt(), currency),
                        style: const TextStyle(color: Color(0xFFFFC043), fontSize: 13),
                      ),
                    ],
                  ),
                ),
              const Divider(color: Color(0xFF222B3D)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total Bill (incl. GST)',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    formatMoney(activeResult.billTotal, currency),
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final bill = widget.state.bill;
    final activeResult = widget.state.result ?? widget.state.preview;
    final currency = bill.currency;
    final headPayers = bill.people.where((p) => p.paidAmount > 0).toList();
    final isMultiHead = headPayers.length > 1;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F1420),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFF1E2638), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Colors.black45,
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. TOP TITLE ROW: [☊ SETTLEMENT MAP / SETTLEMENT]       [View bill details ⌄]
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1C2233),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.hub_rounded,
                      color: Color(0xFF818CF8),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    _isGraphView ? 'SETTLEMENT MAP' : 'SETTLEMENT',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),

              // [View bill details ⌄] Dropdown Button
              GestureDetector(
                onTap: () => _showBillDetailsSheet(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color(0xFF141926),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF263045)),
                  ),
                  child: Row(
                    children: const [
                      Text(
                        'View bill details',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: Color(0xFF94A3B8),
                        size: 16,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // 2. SWITCHER & STATUS BAR:  [Graph | Table]       [✓ Head payer balanced]
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Segmented Capsule Switcher
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: const Color(0xFF141926),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF222B3D)),
                ),
                child: Row(
                  children: [
                    // [ ☊ Graph ]
                    GestureDetector(
                      onTap: () => setState(() => _isGraphView = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          gradient: _isGraphView
                              ? const LinearGradient(
                                  colors: [Color(0xFF6366F1), Color(0xFF7C3AED)],
                                )
                              : null,
                          color: _isGraphView ? null : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: _isGraphView
                              ? const [
                                  BoxShadow(
                                    color: Color(0x667C3AED),
                                    blurRadius: 10,
                                    offset: Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.hub_rounded,
                              size: 13,
                              color: _isGraphView ? Colors.white : const Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Graph',
                              style: TextStyle(
                                color: _isGraphView ? Colors.white : const Color(0xFF94A3B8),
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // [ ☰ Table ]
                    GestureDetector(
                      onTap: () => setState(() => _isGraphView = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: !_isGraphView ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.list_alt_rounded,
                              size: 13,
                              color: !_isGraphView ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Table',
                              style: TextStyle(
                                color: !_isGraphView ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // [✓ Head payer balanced] Status Badge
              // Tapping toggles between Single Head Payer demo and 4 Head Payers demo!
              GestureDetector(
                onTap: () {
                  if (isMultiHead) {
                    widget.state.loadSingleHeadPayerSample();
                  } else {
                    widget.state.loadMultiHeadPayerSample();
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D281E),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF10B981), width: 1.2),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        color: Color(0xFF10B981),
                        size: 14,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        isMultiHead ? '4 head payers balanced' : 'Head payer balanced',
                        style: const TextStyle(
                          color: Color(0xFF34D399),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // 3. MAIN CONTENT: GRAPH VIEW OR TABLE VIEW
          if (_isGraphView)
            SettlementGraphView(state: widget.state)
          else
            SettlementAuditTable(
              state: widget.state,
              onOpenHeadPayers: () => _openHeadPayersSheet(context),
            ),

          const SizedBox(height: 12),

          // 4. TOTAL BILL CARD (Screenshots 1, 2 & 3)
          _buildTotalBillCard(activeResult.billTotal, currency, context),
        ],
      ),
    );
  }

  /// Total Bill (incl. GST) ₹2,693.00 Card with Bar Chart Icon & Chevron
  Widget _buildTotalBillCard(int billTotalPaise, CurrencyCode currency, BuildContext context) {
    return GestureDetector(
      onTap: () => _showBillDetailsSheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF141926),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF222B3D)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF1C2436),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.bar_chart_rounded,
                color: Color(0xFF818CF8),
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Total Bill (incl. GST)',
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  formatMoney(billTotalPaise, currency),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
            const Spacer(),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF64748B),
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
