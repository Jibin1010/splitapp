import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'device_mobile_frame.dart';
import 'device_picker_bar.dart';
import 'device_screen_overlay.dart';

export 'device_mobile_frame.dart';
export 'device_picker_bar.dart';
export 'device_screen_overlay.dart';

class DeviceFrameWrapper extends StatefulWidget {
  final Widget child;

  const DeviceFrameWrapper({
    super.key,
    required this.child,
  });

  @override
  State<DeviceFrameWrapper> createState() => _DeviceFrameWrapperState();
}

class _DeviceFrameWrapperState extends State<DeviceFrameWrapper> {
  PreviewDevice _selectedDevice = PreviewDevice.iphone16Pro;
  bool _dynamicIslandExpanded = false;

  @override
  Widget build(BuildContext context) {
    if (_selectedDevice == PreviewDevice.none) {
      return Material(
        type: MaterialType.transparency,
        child: Stack(
          children: [
            widget.child,
            DevicePickerBar(
              selectedDevice: _selectedDevice,
              onSelectDevice: (d) => setState(() => _selectedDevice = d),
            ),
          ],
        ),
      );
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobileScreen = screenWidth <= 450;

    // Full-screen iOS 18 simulation for mobile displays
    if (isMobileScreen && _selectedDevice == PreviewDevice.iphone16Pro) {
      return DeviceMobileFrame(
        dynamicIslandExpanded: _dynamicIslandExpanded,
        onToggleDynamicIsland: () => setState(
            () => _dynamicIslandExpanded = !_dynamicIslandExpanded),
        selectedDevice: _selectedDevice,
        onSelectDevice: (d) => setState(() => _selectedDevice = d),
        child: widget.child,
      );
    }

    final isIPhone = _selectedDevice == PreviewDevice.iphone16Pro;
    final isS26Ultra = _selectedDevice == PreviewDevice.galaxyS26Ultra;
    final isS26 = _selectedDevice == PreviewDevice.galaxyS26;

    final double width;
    final double height;
    final double cornerRadius;
    final String badgeTitle;

    switch (_selectedDevice) {
      case PreviewDevice.iphone16Pro:
        width = 393.0;
        height = 852.0;
        cornerRadius = 55.0;
        badgeTitle = 'iPhone 16 Pro (iOS Simulator Preview)';
        break;
      case PreviewDevice.galaxyS26Ultra:
        width = 412.0;
        height = 892.0;
        cornerRadius = 24.0;
        badgeTitle = 'Samsung Galaxy S26 Ultra (6.9" One UI 7 Preview)';
        break;
      case PreviewDevice.galaxyS26:
        width = 380.0;
        height = 823.0;
        cornerRadius = 42.0;
        badgeTitle = 'Samsung Galaxy S26 (6.2" One UI 7 Preview)';
        break;
      case PreviewDevice.galaxyS25Ultra:
      default:
        width = 412.0;
        height = 892.0;
        cornerRadius = 28.0;
        badgeTitle = 'Samsung Galaxy S25 Ultra (One UI Preview)';
        break;
    }

    return Scaffold(
      backgroundColor: AppColors.canvasFrame,
      body: Stack(
        children: [
          // Background ambient gradient
          Center(
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    (isIPhone
                            ? const Color(0xFF3B82F6)
                            : const Color(0xFF8B5CF6))
                        .withValues(alpha: 0.12),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Centered Phone Frame
          Center(
            child: SingleChildScrollView(
              padding:
                  const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Device Badge
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isIPhone
                              ? Icons.phone_iphone_rounded
                              : Icons.phone_android_rounded,
                          size: 14,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          badgeTitle,
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.white),
                        ),
                      ],
                    ),
                  ),

                  // Phone Chassis
                  Container(
                    width: width + 24,
                    height: height + 24,
                    decoration: BoxDecoration(
                      borderRadius:
                          BorderRadius.circular(cornerRadius + 12),
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: isIPhone
                            ? const [
                                Color(0xFF6E6E73), // Titanium Natural
                                Color(0xFF2C2C2E),
                                Color(0xFF1C1C1E),
                                Color(0xFF48484A),
                              ]
                            : isS26Ultra
                                ? const [
                                    Color(0xFF4A4E54), // Titanium Gray
                                    Color(0xFF25272B),
                                    Color(0xFF16181B),
                                    Color(0xFF383B40),
                                  ]
                                : isS26
                                    ? const [
                                        Color(0xFF2D3250), // Cobalt Blue
                                        Color(0xFF1E2130),
                                        Color(0xFF141622),
                                        Color(0xFF282B3E),
                                      ]
                                    : const [
                                        Color(0xFF3A3D40), // Titanium Black
                                        Color(0xFF1E2022),
                                        Color(0xFF141517),
                                        Color(0xFF2E3033),
                                      ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.6),
                          blurRadius: 40,
                          spreadRadius: 10,
                          offset: const Offset(0, 20),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(12),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(cornerRadius),
                      child: Container(
                        color: AppColors.background,
                        child: Stack(
                          children: [
                            // Main App Content
                            Positioned.fill(
                              top: isIPhone ? 54 : 44,
                              bottom: isIPhone ? 34 : 24,
                              child: MediaQuery(
                                data: MediaQuery.of(context).copyWith(
                                  size: Size(
                                      width, height - (isIPhone ? 88 : 68)),
                                  padding: EdgeInsets.zero,
                                  viewPadding: EdgeInsets.zero,
                                ),
                                child: widget.child,
                              ),
                            ),

                            // Top Status Bar
                            Positioned(
                              top: 0,
                              left: 0,
                              right: 0,
                              height: isIPhone ? 54 : 44,
                              child: DeviceStatusBar(
                                isIPhone: isIPhone,
                                height: isIPhone ? 54 : 44,
                              ),
                            ),

                            // Dynamic Island
                            if (isIPhone)
                              Positioned(
                                top: 11,
                                left: 0,
                                right: 0,
                                child: DeviceDynamicIsland(
                                  isExpanded: _dynamicIslandExpanded,
                                  onToggle: () => setState(() =>
                                      _dynamicIslandExpanded =
                                          !_dynamicIslandExpanded),
                                ),
                              ),

                            // Samsung Galaxy Centered Punch Hole Camera
                            if (!isIPhone)
                              const Positioned(
                                top: 11,
                                left: 0,
                                right: 0,
                                child: DevicePunchHoleCamera(),
                              ),

                            // Bottom Home Indicator
                            Positioned(
                              bottom: 8,
                              left: 0,
                              right: 0,
                              child: DeviceHomeIndicator(isIPhone: isIPhone),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Floating Device Switcher
          DevicePickerBar(
            selectedDevice: _selectedDevice,
            onSelectDevice: (d) => setState(() => _selectedDevice = d),
          ),
        ],
      ),
    );
  }
}
