import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

enum AvatarSize { xs, sm, md, lg, xl }

class PersonAvatar extends StatelessWidget {
  final String name;
  final String? photo;
  final AvatarSize size;
  final bool isPayer;
  final bool showBadge;
  final bool ring;

  const PersonAvatar({
    super.key,
    required this.name,
    this.photo,
    this.size = AvatarSize.md,
    this.isPayer = false,
    this.showBadge = false,
    this.ring = true,
  });

  static const List<List<Color>> _gradients = [
    [Color(0xFF7C3AED), Color(0xFF4F46E5)],
    [Color(0xFF10B981), Color(0xFF0F766E)],
    [Color(0xFF0EA5E9), Color(0xFF2563EB)],
    [Color(0xFFF43F5E), Color(0xFFE11D48)],
    [Color(0xFFF59E0B), Color(0xFFEA580C)],
    [Color(0xFFD946EF), Color(0xFF9333EA)],
    [Color(0xFF06B6D4), Color(0xFF3B82F6)],
  ];

  double _getDimension() {
    switch (size) {
      case AvatarSize.xs:
        return 22;
      case AvatarSize.sm:
        return 28;
      case AvatarSize.md:
        return 36;
      case AvatarSize.lg:
        return 44;
      case AvatarSize.xl:
        return 56;
    }
  }

  double _getFontSize() {
    switch (size) {
      case AvatarSize.xs:
        return 9;
      case AvatarSize.sm:
        return 11;
      case AvatarSize.md:
        return 13;
      case AvatarSize.lg:
        return 16;
      case AvatarSize.xl:
        return 20;
    }
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) {
      return parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
    }
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  List<Color> _getGradient(String name) {
    int hash = 0;
    for (int i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.codeUnitAt(i);
      hash = hash & 0xFFFFFFFF;
    }
    final index = hash.abs() % _gradients.length;
    return _gradients[index];
  }

  @override
  Widget build(BuildContext context) {
    final dim = _getDimension();
    final fontSize = _getFontSize();
    final initials = _getInitials(name);
    final gradient = _getGradient(name);
    final hasPhoto = photo != null && photo!.trim().isNotEmpty;

    Widget avatarContent;
    if (hasPhoto) {
      avatarContent = Image.network(
        photo!.trim(),
        width: dim,
        height: dim,
        fit: BoxFit.cover,
        errorBuilder: (ctx, err, stack) => _buildInitials(dim, gradient, initials, fontSize),
        loadingBuilder: (ctx, child, progress) {
          if (progress == null) return child;
          return _buildInitials(dim, gradient, initials, fontSize);
        },
      );
    } else {
      avatarContent = _buildInitials(dim, gradient, initials, fontSize);
    }

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: dim,
          height: dim,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: ring
                ? Border.all(
                    color: isPayer ? AppColors.success : AppColors.border,
                    width: isPayer ? 2.0 : 1.0,
                  )
                : null,
          ),
          child: ClipOval(child: avatarContent),
        ),
        if (showBadge && isPayer)
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: dim * 0.28,
              height: dim * 0.28,
              decoration: BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.background, width: 1.5),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildInitials(double dim, List<Color> gradient, String initials, double fontSize) {
    return Container(
      width: dim,
      height: dim,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradient,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          height: 1.0,
        ),
      ),
    );
  }
}
