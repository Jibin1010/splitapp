import 'package:flutter/material.dart';
import '../../../state/bill_state.dart';
import '../../dialogs/user_switcher_sheet.dart';
import 'perspective_card_footer.dart';
import 'perspective_card_header.dart';
import 'perspective_custom_painters.dart';
import 'perspective_metric_cards.dart';
import 'perspective_settlement_strip.dart';

/// A prominent spotlight card displaying the active user's personal financial share,
/// what they ordered, and their settlement status.
/// Styled in Tubik Design System Aesthetics with 3D floating illustration.
class PersonalSpotlightCard extends StatelessWidget {
  final BillState state;
  final VoidCallback onOpenBreakdown;

  const PersonalSpotlightCard({
    super.key,
    required this.state,
    required this.onOpenBreakdown,
  });

  @override
  Widget build(BuildContext context) {
    final active = state.activePerson;
    if (active == null) return const SizedBox.shrink();

    final preview = state.preview;
    final currency = state.bill.currency;
    final pRes = preview.people[active.id];
    final share = pRes?.share ?? 0;
    final paid = active.paidAmount;
    final net = pRes?.net ?? (paid - share);

    final totalBill = preview.billTotal > 0 ? preview.billTotal : 1.0;
    final sharePercentage = ((share / totalBill) * 100).clamp(0.0, 100.0);

    // Items active user is in
    final userItems = state.bill.items.where((item) {
      final itemShare = preview.itemAllocations[item.id]?[active.id] ?? 0;
      return itemShare > 0;
    }).toList();

    // Settlements specifically involving active user
    final incomingSettlements =
        preview.settlements.where((s) => s.toPersonId == active.id).toList();
    final outgoingSettlements =
        preview.settlements.where((s) => s.fromPersonId == active.id).toList();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFF8FAFD),
            Color(0xFFF3F7FD),
            Color(0xFFEEF4FE),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFDBE6FD),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withValues(alpha: 0.05),
            blurRadius: 25,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            // Decorative 3D Pastel Floating Cards Illustration in top right
            const Positioned(
              top: -6,
              right: 28,
              child: IgnorePointer(
                child: SizedBox(
                  width: 140,
                  height: 90,
                  child: CustomPaint(
                    painter: FloatingCardsPainter(),
                  ),
                ),
              ),
            ),

            // Main Content Container
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  PerspectiveCardHeader(
                    active: active,
                    paid: paid,
                    onSwitchProfile: () => UserSwitcherSheet.show(context, state),
                  ),

                  const SizedBox(height: 14),

                  PerspectiveMetricCards(
                    share: share,
                    paid: paid,
                    net: net,
                    currency: currency,
                    sharePercentage: sharePercentage,
                    hasItems: state.bill.items.isNotEmpty,
                  ),

                  const SizedBox(height: 12),

                  PerspectiveSettlementStrip(
                    outgoingSettlements: outgoingSettlements,
                    incomingSettlements: incomingSettlements,
                    people: state.bill.people,
                    currency: currency,
                  ),

                  if (outgoingSettlements.isNotEmpty || incomingSettlements.isNotEmpty)
                    const SizedBox(height: 12),

                  PerspectiveCardFooter(
                    userItemsCount: userItems.length,
                    totalItemsCount: state.bill.items.length,
                    onOpenBreakdown: onOpenBreakdown,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
