import 'package:flutter/material.dart';

class RevenueWeekChart extends StatelessWidget {
  final List<Map<String, dynamic>> weekDays;
  final int selectedDayIndex;
  final ValueChanged<int> onSelectDay;

  const RevenueWeekChart({
    super.key,
    required this.weekDays,
    required this.selectedDayIndex,
    required this.onSelectDay,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 70,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(weekDays.length, (index) {
          final day = weekDays[index];
          final isSelected = index == selectedDayIndex;
          return GestureDetector(
            onTap: () => onSelectDay(index),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: 28,
                  height: 48 * (day['height'] as double),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Colors.black
                        : Colors.white.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(14),
                    border: isSelected
                        ? Border.all(
                            color: Colors.white.withValues(alpha: 0.6),
                            width: 1.5)
                        : null,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  day['day'],
                  style: TextStyle(
                    color: isSelected
                        ? Colors.black
                        : Colors.white.withValues(alpha: 0.8),
                    fontSize: 10,
                    fontWeight:
                        isSelected ? FontWeight.w900 : FontWeight.w600,
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
