import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';

class VisionDialogHeader extends StatelessWidget {
  final VoidCallback onClose;

  const VisionDialogHeader({super.key, required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.auto_awesome, size: 16, color: Colors.white),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AI Receipt Scanner',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      'Extracts verbatim receipt text and parses line items.',
                      style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.close_rounded, size: 20),
          onPressed: onClose,
        ),
      ],
    );
  }
}
