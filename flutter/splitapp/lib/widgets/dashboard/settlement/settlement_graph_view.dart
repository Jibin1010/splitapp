import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../state/bill_state.dart';
import '../../common/person_avatar.dart';

/// Settlement Map Graph View
/// Pixel-perfect matching of Screenshot 1 with golden curved flow arrows,
/// head payer glowing node, debtor cards, and transfer badges.
class SettlementGraphView extends StatelessWidget {
  final BillState state;

  const SettlementGraphView({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final bill = state.bill;
    final activeResult = state.result ?? state.preview;
    final currency = bill.currency;
    final settlements = activeResult.settlements;

    // Head payers (creditors)
    final headPayers = bill.people.where((p) => p.paidAmount > 0).toList();
    final primaryHead = headPayers.isNotEmpty
        ? headPayers.first
        : bill.people.isNotEmpty
            ? bill.people.first
            : Person(id: 'head', name: 'Maya', paidAmount: 246000);

    // Debtors (people who owe money or have transfers)
    final debtors = bill.people.where((p) {
      final net = activeResult.people[p.id]?.net ?? 0;
      return net < 0;
    }).toList();

    // Fallback debtors if empty (e.g. for preview)
    final displayDebtors = debtors.isNotEmpty
        ? debtors
        : bill.people.where((p) => p.id != primaryHead.id).toList();

    final activePerson = state.activePerson;

    return Column(
      children: [
        const SizedBox(height: 12),

        // 1. TOP NODE: Head Payer (Maya) with Golden Glowing Border
        _buildHeadPayerNode(primaryHead, currency),

        // 2. CONNECTING CURVED ARROWS WITH AMOUNT BADGES
        LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            const height = 110.0;
            final count = math.max(1, displayDebtors.length);

            // Compute positions
            final List<double> debtorXList = [];
            final List<String> amounts = [];

            for (int i = 0; i < count; i++) {
              final debtor = displayDebtors[i];
              // Find settlement from debtor to head
              final s = settlements.where((set) => set.fromPersonId == debtor.id).firstOrNull;
              final net = activeResult.people[debtor.id]?.net ?? 0;
              final amt = s?.amount ?? (net < 0 ? -net : 0);
              amounts.add(formatMoney(amt, currency));

              if (count == 3) {
                // Exact alignment with the 3 cards below
                if (i == 0) debtorXList.add(width * 0.17);
                if (i == 1) debtorXList.add(width * 0.50);
                if (i == 2) debtorXList.add(width * 0.83);
              } else {
                debtorXList.add(width * ((i + 0.5) / count));
              }
            }

            return SizedBox(
              width: width,
              height: height,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Custom painted curved lines & arrow heads
                  CustomPaint(
                    size: Size(width, height),
                    painter: _SettlementFlowPainter(
                      debtorXList: debtorXList,
                      width: width,
                      height: height,
                    ),
                  ),

                  // Floating amount badges on the curves
                  for (int i = 0; i < debtorXList.length; i++)
                    _buildAmountBadge(
                      amount: amounts[i],
                      x: debtorXList[i],
                      y: height * 0.44,
                    ),
                ],
              ),
            );
          },
        ),

        // 3. BOTTOM ROW: DEBTOR CARDS
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: displayDebtors.map((debtor) {
            final isYou = activePerson != null && debtor.id == activePerson.id;
            final net = activeResult.people[debtor.id]?.net ?? 0;
            final owesAmount = net < 0 ? -net : 0;

            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: _buildDebtorCard(
                  debtor: debtor,
                  isYou: isYou,
                  owesText: 'Owes ${formatMoney(owesAmount, currency)}',
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 20),

        // 4. LEGEND BAR: [ → Pays to Maya  |  + Amount to transfer ]
        _buildLegendBar(primaryHead.name),

        const SizedBox(height: 12),
      ],
    );
  }

  /// Top Head Payer Node (Glowing Gold Rounded Card)
  Widget _buildHeadPayerNode(Person head, CurrencyCode currency) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF141926),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFFFB800), width: 1.8),
        boxShadow: const [
          BoxShadow(
            color: Color(0x3DFFB800),
            blurRadius: 18,
            spreadRadius: 1,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar
          PersonAvatar(
            name: head.name,
            photo: head.photo,
            size: AvatarSize.md,
            ring: false,
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('👑', style: TextStyle(fontSize: 13)),
                  const SizedBox(width: 6),
                  Text(
                    head.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              RichText(
                text: TextSpan(
                  children: [
                    const TextSpan(
                      text: 'Paid ',
                      style: TextStyle(
                        color: Color(0xFFFFC043),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    TextSpan(
                      text: formatMoney(head.paidAmount, currency),
                      style: const TextStyle(
                        color: Color(0xFFFFC043),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Amount Badge positioned on each curve
  Widget _buildAmountBadge({
    required String amount,
    required double x,
    required double y,
  }) {
    return Positioned(
      left: x - 40,
      top: y - 14,
      child: Container(
        width: 80,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF111624),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF333E56), width: 1.2),
          boxShadow: const [
            BoxShadow(
              color: Colors.black54,
              blurRadius: 8,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            amount,
            style: const TextStyle(
              color: Color(0xFFFFC043),
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ),
    );
  }

  /// Debtor Card (Bottom Row)
  Widget _buildDebtorCard({
    required Person debtor,
    required bool isYou,
    required String owesText,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF141926),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isYou ? const Color(0xFF6366F1).withValues(alpha: 0.6) : const Color(0xFF222B3D),
          width: isYou ? 1.4 : 1.0,
        ),
        boxShadow: isYou
            ? [
                BoxShadow(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar (with electric purple/blue glow ring if "YOU")
          Container(
            padding: const EdgeInsets.all(2.5),
            decoration: isYou
                ? BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF818CF8), width: 2.2),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x66818CF8),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  )
                : null,
            child: PersonAvatar(
              name: debtor.name,
              photo: debtor.photo,
              size: AvatarSize.md,
              ring: false,
            ),
          ),
          const SizedBox(height: 8),

          // Name (+ "• YOU" tag if applicable)
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  debtor.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (isYou) ...[
                  const SizedBox(width: 4),
                  const Text(
                    '• YOU',
                    style: TextStyle(
                      color: Color(0xFF818CF8),
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 4),

          // Owes Amount in Coral Red
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              owesText,
              style: const TextStyle(
                color: Color(0xFFFF5C5C),
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Legend Bar below cards
  Widget _buildLegendBar(String headName) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF141926),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF222B3D)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.arrow_right_alt_rounded,
            color: Color(0xFFFFB800),
            size: 18,
          ),
          const SizedBox(width: 6),
          Text(
            'Pays to $headName',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 14),
          Container(
            width: 1,
            height: 14,
            color: const Color(0xFF2A344A),
          ),
          const SizedBox(width: 14),
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: const Color(0xFF282112),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Icon(
              Icons.add_rounded,
              color: Color(0xFFFFC043),
              size: 11,
            ),
          ),
          const SizedBox(width: 6),
          const Text(
            'Amount to transfer',
            style: TextStyle(
              color: Color(0xFFFFC043),
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// CustomPainter that renders warm golden curved Bézier lines with arrowheads
class _SettlementFlowPainter extends CustomPainter {
  final List<double> debtorXList;
  final double width;
  final double height;

  _SettlementFlowPainter({
    required this.debtorXList,
    required this.width,
    required this.height,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = const Color(0xFFE5A93C)
      ..strokeWidth = 1.6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final arrowPaint = Paint()
      ..color = const Color(0xFFE5A93C)
      ..style = PaintingStyle.fill;

    final headCenterX = width * 0.50;
    const headBottomY = 0.0;

    for (int i = 0; i < debtorXList.length; i++) {
      final startX = debtorXList[i];
      final startY = height;

      // Target point on head payer node:
      // Left curve targets slightly left of head center
      // Center curve targets exact center
      // Right curve targets slightly right of head center
      double targetX = headCenterX;
      if (debtorXList.length == 3) {
        if (i == 0) targetX = headCenterX - 40;
        if (i == 1) targetX = headCenterX;
        if (i == 2) targetX = headCenterX + 40;
      }

      final path = Path();
      path.moveTo(startX, startY);

      // Smooth cubic Bézier to target
      final controlY1 = startY - (height * 0.45);
      final controlY2 = headBottomY + (height * 0.45);

      path.cubicTo(
        startX,
        controlY1,
        targetX,
        controlY2,
        targetX,
        headBottomY + 4,
      );

      canvas.drawPath(path, linePaint);

      // Draw arrowhead at target pointing UP
      _drawArrowHead(canvas, targetX, headBottomY + 2, arrowPaint);
    }
  }

  void _drawArrowHead(Canvas canvas, double x, double y, Paint paint) {
    final arrowPath = Path();
    arrowPath.moveTo(x, y);
    arrowPath.lineTo(x - 4.5, y + 8);
    arrowPath.lineTo(x + 4.5, y + 8);
    arrowPath.close();
    canvas.drawPath(arrowPath, paint);
  }

  @override
  bool shouldRepaint(covariant _SettlementFlowPainter oldDelegate) {
    return oldDelegate.debtorXList != debtorXList ||
        oldDelegate.width != width ||
        oldDelegate.height != height;
  }
}
