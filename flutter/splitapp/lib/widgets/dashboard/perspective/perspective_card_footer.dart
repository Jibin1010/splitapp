import 'package:flutter/material.dart';

class PerspectiveCardFooter extends StatelessWidget {
  final int userItemsCount;
  final int totalItemsCount;
  final VoidCallback onOpenBreakdown;

  const PerspectiveCardFooter({
    super.key,
    required this.userItemsCount,
    required this.totalItemsCount,
    required this.onOpenBreakdown,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: [
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 6,
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: const Color(0xFFEEF2FF),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(
                Icons.shopping_bag_outlined,
                size: 13,
                color: Color(0xFF4F46E5),
              ),
            ),
            Text.rich(
              TextSpan(
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 11,
                ),
                children: [
                  const TextSpan(text: 'In '),
                  TextSpan(
                    text: '$userItemsCount of $totalItemsCount',
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const TextSpan(text: ' items'),
                ],
              ),
            ),
          ],
        ),
        InkWell(
          onTap: onOpenBreakdown,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2FF),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE0E7FF)),
            ),
            child: const Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 4,
              children: [
                Icon(Icons.grid_view_rounded, size: 12, color: Color(0xFF4F46E5)),
                Text(
                  'View in table',
                  style: TextStyle(
                    color: Color(0xFF4F46E5),
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Icon(Icons.keyboard_arrow_down_rounded, size: 13, color: Color(0xFF4F46E5)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
