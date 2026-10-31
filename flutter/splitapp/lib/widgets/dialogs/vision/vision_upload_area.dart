import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';

class VisionUploadArea extends StatelessWidget {
  final Uint8List? imageRawBytes;
  final String imageName;
  final VoidCallback onPickImage;
  final VoidCallback onClearImage;

  const VisionUploadArea({
    super.key,
    required this.imageRawBytes,
    required this.imageName,
    required this.onPickImage,
    required this.onClearImage,
  });

  @override
  Widget build(BuildContext context) {
    if (imageRawBytes == null) {
      return InkWell(
        onTap: onPickImage,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: AppColors.surfaceElevated.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border, style: BorderStyle.solid),
          ),
          child: const Column(
            children: [
              Icon(Icons.cloud_upload_outlined, size: 40, color: AppColors.primaryLight),
              SizedBox(height: 8),
              Text(
                'Click to select or upload bill receipt image',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Supports PNG, JPG, JPEG, WEBP photos of any receipt or invoice',
                style: TextStyle(fontSize: 11, color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Image.memory(
              imageRawBytes!,
              width: 54,
              height: 54,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  imageName.isEmpty ? 'Uploaded receipt' : imageName,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Ready for OCR & product extraction',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: onPickImage,
            child: const Text('Change', style: TextStyle(fontSize: 11)),
          ),
          const SizedBox(width: 6),
          IconButton(
            icon: const Icon(Icons.close_rounded, size: 18),
            onPressed: onClearImage,
          ),
        ],
      ),
    );
  }
}
