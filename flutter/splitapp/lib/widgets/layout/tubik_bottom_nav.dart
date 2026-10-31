import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// Tubik Style Floating Bottom Pill Navigation Bar
/// Derived directly from the Dribbble shot bottom navigation capsule
class TubikBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback onAddAction;

  const TubikBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTabSelected,
    required this.onAddAction,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Dark Floating Pill Container
              Container(
                height: 56,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: AppColors.border, width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildNavItem(
                      icon: Icons.home_filled,
                      index: 0,
                      label: 'Home',
                    ),
                    const SizedBox(width: 8),
                    _buildNavItem(
                      icon: Icons.insights_rounded,
                      index: 1,
                      label: 'Flow',
                    ),
                    const SizedBox(width: 8),
                    _buildNavItem(
                      icon: Icons.receipt_long_rounded,
                      index: 2,
                      label: 'Bill',
                    ),
                    const SizedBox(width: 8),
                    _buildNavItem(
                      icon: Icons.auto_awesome_rounded,
                      index: 3,
                      label: 'AI Lead',
                      hasBadge: true,
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 14),

              // Honey Yellow Floating Circle Action Button '+' (Tubik shot Screen 1 & 5)
              GestureDetector(
                onTap: onAddAction,
                child: Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: AppColors.honeyYellow,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.honeyYellow.withValues(alpha: 0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(Icons.add_rounded, color: Colors.black, size: 28),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required int index,
    required String label,
    bool hasBadge = false,
  }) {
    final isSelected = currentIndex == index;
    return Tooltip(
      message: label,
      child: GestureDetector(
        onTap: () => onTabSelected(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? Colors.black : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: isSelected
                ? Border.all(color: Colors.white.withValues(alpha: 0.15), width: 1)
                : null,
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected ? Colors.white : AppColors.textMuted,
              ),
              if (hasBadge && !isSelected)
                Positioned(
                  top: -2,
                  right: -2,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppColors.coral,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
