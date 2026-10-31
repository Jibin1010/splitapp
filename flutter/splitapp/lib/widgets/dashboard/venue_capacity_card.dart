import 'package:flutter/material.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';

/// Tubik Style Electric Iris Purple Card for Venue Capacity & Split Distribution
/// Derived directly from Screen 2 "VENUE CAPACITY"
class VenueCapacityCard extends StatefulWidget {
  final BillState state;

  const VenueCapacityCard({super.key, required this.state});

  @override
  State<VenueCapacityCard> createState() => _VenueCapacityCardState();
}

class _VenueCapacityCardState extends State<VenueCapacityCard> {
  int _activeLocationIndex = 0;

  final List<String> _locations = ['Astoria', 'Long Island City', 'Rogo Park'];

  final List<Map<String, dynamic>> _days = [
    {'day': 'Mon', 'pct': '78%'},
    {'day': 'Tue', 'pct': '82%'},
    {'day': 'Wen', 'pct': '91%'},
    {'day': 'Thu', 'pct': '88%'},
    {'day': 'Fri', 'pct': '85%'},
    {'day': 'Sat', 'pct': '93%'},
    {'day': 'Sun', 'pct': '70%'},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.electricIris,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: AppColors.electricIris.withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Title & Dropdown Pill
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 6,
            children: [
              const Text(
                'VENUE CAPACITY',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'this week',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: Colors.white),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Weekday Capacity Pills
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: _days.map((item) {
              final isPeak = item['day'] == 'Wen' || item['day'] == 'Sat';
              return Flexible(
                child: Column(
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        item['day'],
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
                      decoration: BoxDecoration(
                        color: isPeak ? Colors.black : Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          item['pct'],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 14),

          // Custom Painted Bezier Wave Area Chart
          SizedBox(
            height: 90,
            width: double.infinity,
            child: CustomPaint(
              painter: _CapacityWavePainter(),
            ),
          ),

          const SizedBox(height: 12),

          // Bottom Location Filter Pills
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: List.generate(_locations.length, (index) {
              final isSelected = index == _activeLocationIndex;
              final loc = _locations[index];
              return GestureDetector(
                onTap: () => setState(() => _activeLocationIndex = index),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.black : Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: index == 0
                              ? AppColors.coral
                              : index == 1
                                  ? AppColors.iceCyan
                                  : AppColors.honeyYellow,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        loc,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _CapacityWavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Fill path (Coral glow)
    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          AppColors.coral.withValues(alpha: 0.85),
          AppColors.coral.withValues(alpha: 0.15),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    // Stroke path (Coral bold line)
    final strokePaint = Paint()
      ..color = AppColors.coral
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    path.moveTo(0, size.height * 0.7);
    path.cubicTo(
      size.width * 0.2,
      size.height * 0.35,
      size.width * 0.35,
      size.height * 0.2,
      size.width * 0.45,
      size.height * 0.25,
    );
    path.cubicTo(
      size.width * 0.55,
      size.height * 0.3,
      size.width * 0.65,
      size.height * 0.75,
      size.width * 0.75,
      size.height * 0.6,
    );
    path.cubicTo(
      size.width * 0.85,
      size.height * 0.45,
      size.width * 0.92,
      size.height * 0.8,
      size.width,
      size.height * 0.65,
    );

    // Draw stroke
    canvas.drawPath(path, strokePaint);

    // Close path for fill
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    canvas.drawPath(path, fillPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
