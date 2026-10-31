import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import 'perspective_custom_painters.dart';

class PerspectiveSettlementStrip extends StatelessWidget {
  final List<Settlement> outgoingSettlements;
  final List<Settlement> incomingSettlements;
  final List<Person> people;
  final CurrencyCode currency;

  const PerspectiveSettlementStrip({
    super.key,
    required this.outgoingSettlements,
    required this.incomingSettlements,
    required this.people,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    if (outgoingSettlements.isEmpty && incomingSettlements.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F3FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFEDE9FE)),
      ),
      child: Column(
        children: [
          ...outgoingSettlements.map((s) {
            final receiver = people.firstWhere(
              (p) => p.id == s.toPersonId,
              orElse: () => Person(id: s.toPersonId, name: 'Someone'),
            );
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: const Icon(Icons.person_outline_rounded, size: 14, color: Color(0xFF7C3AED)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'YOUR PERSONAL SETTLEMENT FLOW',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 8,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.4,
                          ),
                        ),
                        const SizedBox(height: 1),
                        RichText(
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          text: TextSpan(
                            style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
                            children: [
                              const TextSpan(text: 'You pay '),
                              TextSpan(
                                text: receiver.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF7C3AED),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  const SizedBox(
                    width: 38,
                    height: 12,
                    child: CustomPaint(
                      painter: DottedArrowPainter(
                        color: Color(0xFFC4B5FD),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      formatMoney(s.amount, currency),
                      style: const TextStyle(
                        color: Color(0xFF6D28D9),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
          ...incomingSettlements.map((s) {
            final sender = people.firstWhere(
              (p) => p.id == s.fromPersonId,
              orElse: () => Person(id: s.fromPersonId, name: 'Someone'),
            );
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: const Icon(Icons.person_outline_rounded, size: 14, color: Color(0xFF059669)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'YOUR PERSONAL SETTLEMENT FLOW',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 8,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.4,
                          ),
                        ),
                        const SizedBox(height: 1),
                        RichText(
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          text: TextSpan(
                            style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
                            children: [
                              TextSpan(
                                text: sender.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF059669),
                                ),
                              ),
                              const TextSpan(text: ' will pay you'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  const SizedBox(
                    width: 38,
                    height: 12,
                    child: CustomPaint(
                      painter: DottedArrowPainter(
                        color: Color(0xFFA7F3D0),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '+${formatMoney(s.amount, currency)}',
                      style: const TextStyle(
                        color: Color(0xFF059669),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
