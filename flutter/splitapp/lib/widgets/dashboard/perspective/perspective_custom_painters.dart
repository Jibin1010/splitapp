import 'package:flutter/material.dart';

/// Custom painter for the dotted settlement connector line with terminal arrow
class DottedArrowPainter extends CustomPainter {
  final Color color;
  const DottedArrowPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;

    double startX = 0;
    const double dashWidth = 3.5;
    const double dashSpace = 4.0;
    final y = size.height / 2;

    while (startX < size.width - 6) {
      canvas.drawLine(Offset(startX, y), Offset(startX + dashWidth, y), paint);
      startX += dashWidth + dashSpace;
    }

    // Terminal arrow tip
    final arrowPaint = Paint()
      ..color = color
      ..strokeWidth = 1.6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final path = Path()
      ..moveTo(size.width - 5, y - 3.5)
      ..lineTo(size.width, y)
      ..lineTo(size.width - 5, y + 3.5);

    canvas.drawPath(path, arrowPaint);
  }

  @override
  bool shouldRepaint(covariant DottedArrowPainter oldDelegate) =>
      oldDelegate.color != color;
}

/// Custom painter for the 3D pastel floating cards illustration in top right corner
class FloatingCardsPainter extends CustomPainter {
  const FloatingCardsPainter();

  @override
  void paint(Canvas canvas, Size size) {
    // Sparkle stars
    final yellowPaint = Paint()..color = const Color(0xFFFBBF24).withValues(alpha: 0.85);
    final bluePaint = Paint()..color = const Color(0xFF60A5FA).withValues(alpha: 0.85);

    void drawStar(Offset center, double r, Paint paint) {
      final path = Path()
        ..moveTo(center.dx, center.dy - r)
        ..quadraticBezierTo(center.dx, center.dy, center.dx + r, center.dy)
        ..quadraticBezierTo(center.dx, center.dy, center.dx, center.dy + r)
        ..quadraticBezierTo(center.dx, center.dy, center.dx - r, center.dy)
        ..quadraticBezierTo(center.dx, center.dy, center.dx, center.dy - r)
        ..close();
      canvas.drawPath(path, paint);
    }

    // Yellow star at top
    drawStar(const Offset(96, 12), 7, yellowPaint);
    // Blue star on left
    drawStar(const Offset(16, 30), 5, bluePaint);

    // Pink / Coral Floating Card (rotated ~18 deg)
    canvas.save();
    canvas.translate(88, 50);
    canvas.rotate(18 * 3.14159 / 180);
    final pinkRect = RRect.fromRectAndRadius(
      const Rect.fromLTWH(-27, -19, 54, 40),
      const Radius.circular(12),
    );
    final pinkPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFF472B6), Color(0xFFFDA4AF)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(pinkRect.outerRect);
    // Soft shadow
    canvas.drawRRect(
      pinkRect.shift(const Offset(0, 5)),
      Paint()
        ..color = const Color(0xFFF472B6).withValues(alpha: 0.28)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 7),
    );
    canvas.drawRRect(pinkRect, pinkPaint);
    // Inner pill
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(-17, -9, 22, 9), const Radius.circular(4.5)),
      Paint()..color = Colors.white.withValues(alpha: 0.45),
    );
    canvas.restore();

    // Lavender / Blue Floating Card (rotated ~ -15 deg)
    canvas.save();
    canvas.translate(46, 44);
    canvas.rotate(-15 * 3.14159 / 180);
    final blueRect = RRect.fromRectAndRadius(
      const Rect.fromLTWH(-29, -21, 58, 44),
      const Radius.circular(13),
    );
    final blueCardPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF818CF8), Color(0xFFC7D2FE)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(blueRect.outerRect);
    // Soft shadow
    canvas.drawRRect(
      blueRect.shift(const Offset(0, 6)),
      Paint()
        ..color = const Color(0xFF6366F1).withValues(alpha: 0.22)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 9),
    );
    canvas.drawRRect(blueRect, blueCardPaint);
    // Inner pills
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(-17, -11, 24, 10), const Radius.circular(5)),
      Paint()..color = Colors.white.withValues(alpha: 0.55),
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(-17, 5, 36, 4), const Radius.circular(2)),
      Paint()..color = Colors.white.withValues(alpha: 0.35),
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
