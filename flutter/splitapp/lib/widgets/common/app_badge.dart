import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

enum BadgeVariant {
  standard,
  secondary,
  success,
  warning,
  danger,
  outline,
}

class AppBadge extends StatelessWidget {
  final Widget? icon;
  final String label;
  final BadgeVariant variant;
  final VoidCallback? onTap;

  const AppBadge({
    super.key,
    this.icon,
    required this.label,
    this.variant = BadgeVariant.standard,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Color border;

    switch (variant) {
      case BadgeVariant.standard:
        bg = AppColors.primarySubtle;
        fg = AppColors.primaryLight;
        border = AppColors.primary.withValues(alpha: 0.3);
        break;
      case BadgeVariant.secondary:
        bg = AppColors.surfaceElevated;
        fg = AppColors.textSecondary;
        border = AppColors.border;
        break;
      case BadgeVariant.success:
        bg = AppColors.successSubtle;
        fg = AppColors.success;
        border = AppColors.success.withValues(alpha: 0.3);
        break;
      case BadgeVariant.warning:
        bg = AppColors.warningSubtle;
        fg = AppColors.warning;
        border = AppColors.warning.withValues(alpha: 0.3);
        break;
      case BadgeVariant.danger:
        bg = AppColors.dangerSubtle;
        fg = AppColors.danger;
        border = AppColors.danger.withValues(alpha: 0.3);
        break;
      case BadgeVariant.outline:
        bg = Colors.transparent;
        fg = AppColors.textSecondary;
        border = AppColors.border;
        break;
    }

    Widget content = Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (icon != null) ...[
            IconTheme(
              data: IconThemeData(size: 12, color: fg),
              child: icon!,
            ),
            const SizedBox(width: 4),
          ],
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: fg,
                fontSize: 11,
                fontWeight: FontWeight.w600,
                height: 1.2,
              ),
            ),
          ),
        ],
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: content,
      );
    }
    return content;
  }
}
