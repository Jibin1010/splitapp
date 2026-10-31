import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

enum PreviewDevice {
  none,
  iphone16Pro,
  galaxyS26Ultra,
  galaxyS26,
  galaxyS25Ultra,
}

class DevicePickerBar extends StatelessWidget {
  final PreviewDevice selectedDevice;
  final ValueChanged<PreviewDevice> onSelectDevice;

  const DevicePickerBar({
    super.key,
    required this.selectedDevice,
    required this.onSelectDevice,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 20,
      right: 20,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated.withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.4),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildButton(
                device: PreviewDevice.none,
                icon: Icons.fullscreen_rounded,
                label: 'Native',
              ),
              const SizedBox(width: 4),
              _buildButton(
                device: PreviewDevice.iphone16Pro,
                icon: Icons.phone_iphone_rounded,
                label: 'iPhone 16 Pro',
              ),
              const SizedBox(width: 4),
              _buildButton(
                device: PreviewDevice.galaxyS26Ultra,
                icon: Icons.phone_android_rounded,
                label: 'S26 Ultra',
              ),
              const SizedBox(width: 4),
              _buildButton(
                device: PreviewDevice.galaxyS26,
                icon: Icons.phone_android_rounded,
                label: 'S26 Base',
              ),
              const SizedBox(width: 4),
              _buildButton(
                device: PreviewDevice.galaxyS25Ultra,
                icon: Icons.phone_android_rounded,
                label: 'S25 Ultra',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildButton({
    required PreviewDevice device,
    required IconData icon,
    required String label,
  }) {
    final isSelected = selectedDevice == device;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => onSelectDevice(device),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 14,
                color: isSelected ? Colors.white : AppColors.textMuted,
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
