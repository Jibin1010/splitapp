import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'device_picker_bar.dart';
import 'device_screen_overlay.dart';

class DeviceMobileFrame extends StatelessWidget {
  final Widget child;
  final bool dynamicIslandExpanded;
  final VoidCallback onToggleDynamicIsland;
  final PreviewDevice selectedDevice;
  final ValueChanged<PreviewDevice> onSelectDevice;

  const DeviceMobileFrame({
    super.key,
    required this.child,
    required this.dynamicIslandExpanded,
    required this.onToggleDynamicIsland,
    required this.selectedDevice,
    required this.onSelectDevice,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.background,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: MediaQuery(
              data: MediaQuery.of(context).copyWith(
                padding: const EdgeInsets.only(top: 48, bottom: 24),
              ),
              child: Padding(
                padding: const EdgeInsets.only(top: 48, bottom: 24),
                child: child,
              ),
            ),
          ),
          const Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 48,
            child: IgnorePointer(
              child: DeviceStatusBar(isIPhone: true, height: 48),
            ),
          ),
          Positioned(
            top: 10,
            left: 0,
            right: 0,
            child: DeviceDynamicIsland(
              isExpanded: dynamicIslandExpanded,
              onToggle: onToggleDynamicIsland,
            ),
          ),
          const Positioned(
            bottom: 8,
            left: 0,
            right: 0,
            child: DeviceHomeIndicator(isIPhone: true),
          ),
          DevicePickerBar(
            selectedDevice: selectedDevice,
            onSelectDevice: onSelectDevice,
          ),
        ],
      ),
    );
  }
}
