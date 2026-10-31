import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class DeviceStatusBar extends StatelessWidget {
  final bool isIPhone;
  final double height;

  const DeviceStatusBar({
    super.key,
    required this.isIPhone,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      height: height,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            '9:41',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
            ),
          ),
          Row(
            children: [
              const Icon(Icons.signal_cellular_alt_rounded,
                  size: 15, color: Colors.white),
              const SizedBox(width: 5),
              Text(
                isIPhone ? '5G' : '5G+',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 5),
              const Icon(Icons.wifi_rounded, size: 15, color: Colors.white),
              const SizedBox(width: 6),
              Container(
                width: 22,
                height: 11,
                decoration: BoxDecoration(
                  border: Border.all(
                      color: Colors.white.withValues(alpha: 0.8), width: 1.2),
                  borderRadius: BorderRadius.circular(3),
                ),
                padding: const EdgeInsets.all(1),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(1.5),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class DeviceDynamicIsland extends StatelessWidget {
  final bool isExpanded;
  final VoidCallback onToggle;

  const DeviceDynamicIsland({
    super.key,
    required this.isExpanded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GestureDetector(
        onTap: onToggle,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutBack,
          width: isExpanded ? 240 : 120,
          height: isExpanded ? 46 : 32,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 8,
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: isExpanded
              ? const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Icon(Icons.receipt_long_rounded,
                        color: AppColors.primary, size: 18),
                    Text(
                      'SplitLedger Active',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold),
                    ),
                    Icon(Icons.bolt_rounded,
                        color: AppColors.success, size: 18),
                  ],
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),
                    Container(
                      width: 11,
                      height: 11,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF0F1A2A),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class DeviceHomeIndicator extends StatelessWidget {
  final bool isIPhone;

  const DeviceHomeIndicator({super.key, required this.isIPhone});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: isIPhone ? 134 : 100,
        height: 5,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(3),
        ),
      ),
    );
  }
}

class DevicePunchHoleCamera extends StatelessWidget {
  const DevicePunchHoleCamera({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFF080808),
          border: Border.all(
            color: const Color(0xFF222222),
            width: 1.5,
          ),
        ),
      ),
    );
  }
}
