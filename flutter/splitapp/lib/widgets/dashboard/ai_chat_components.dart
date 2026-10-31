import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class AiMessageItem extends StatelessWidget {
  final Map<String, String> message;

  const AiMessageItem({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message['role'] == 'user';

    if (isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.electricIris,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Text(
            message['text'] ?? '',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
    }

    // AI Message bubble (Tubik style dark card)
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.surfaceElevated,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.electricIris, width: 1.2),
          ),
          child: const Center(
            child: Icon(Icons.auto_awesome,
                color: AppColors.electricIris, size: 16),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(
              message['text'] ?? '',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12.5,
                height: 1.45,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class AiQuickChip extends StatelessWidget {
  final String icon;
  final String label;
  final Color color;
  final Color textColor;
  final VoidCallback onTap;

  const AiQuickChip({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    required this.textColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.25),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(icon, style: const TextStyle(fontSize: 12)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: textColor,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AiInputBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onSend;

  const AiInputBar({
    super.key,
    required this.controller,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Coral '+' Button
        GestureDetector(
          onTap: () => onSend(controller.text),
          child: Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: AppColors.coral,
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(Icons.add_rounded, color: Colors.white, size: 24),
            ),
          ),
        ),
        const SizedBox(width: 10),
        // Dark Capsule Input Field
        Expanded(
          child: Container(
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    onSubmitted: onSend,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(
                      hintText: 'Ask something to start',
                      hintStyle:
                          TextStyle(color: AppColors.textMuted, fontSize: 12),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      filled: false,
                    ),
                  ),
                ),
                const Icon(
                  Icons.graphic_eq_rounded,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
