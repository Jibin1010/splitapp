import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// Tubik Style Restaurant Operations Integrations Cards
/// Derived directly from Screen 6 "INTEGRATIONS"
class IntegrationsCard extends StatelessWidget {
  const IntegrationsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header with Title & Filter Pills
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [
            const Text(
              'INTEGRATIONS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
              ),
            ),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildFilterPill('all operations'),
                _buildFilterPill('all experience'),
              ],
            ),
          ],
        ),

        const SizedBox(height: 12),

        // 1. QuickBooks (Coral Card)
        _buildIntegrationItem(
          name: 'QUICKBOOKS',
          tag: 'Unconnected',
          tagColor: Colors.black.withValues(alpha: 0.25),
          tagTextColor: Colors.white,
          backgroundColor: AppColors.coral,
          logoText: 'qb',
          logoBg: const Color(0xFF1F2422),
          logoFg: Colors.white,
          isBoldLogo: true,
        ),

        const SizedBox(height: 10),

        // 2. Xero (Warm Sand / Honey Yellow Card)
        _buildIntegrationItem(
          name: 'XERO',
          tag: 'Connected ✓',
          tagColor: Colors.black.withValues(alpha: 0.15),
          tagTextColor: Colors.black,
          backgroundColor: AppColors.honeyYellow,
          logoText: 'xero',
          logoBg: const Color(0xFF1E2422),
          logoFg: Colors.white,
          textColor: Colors.black,
        ),

        const SizedBox(height: 10),

        // 3. Homebase / Toast POS (Ice Blue Card)
        _buildIntegrationItem(
          name: 'HOMEBASE / TOAST',
          tag: 'Connected ✓',
          tagColor: Colors.black.withValues(alpha: 0.15),
          tagTextColor: const Color(0xFF003845),
          backgroundColor: AppColors.iceCyan,
          logoText: 'POS',
          logoBg: const Color(0xFF18282D),
          logoFg: Colors.white,
          textColor: const Color(0xFF003845),
        ),
      ],
    );
  }

  Widget _buildFilterPill(String title) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.keyboard_arrow_down_rounded, size: 12, color: AppColors.textSecondary),
        ],
      ),
    );
  }

  Widget _buildIntegrationItem({
    required String name,
    required String tag,
    required Color tagColor,
    required Color tagTextColor,
    required Color backgroundColor,
    required String logoText,
    required Color logoBg,
    required Color logoFg,
    Color textColor = Colors.white,
    bool isBoldLogo = false,
  }) {
    return Container(
      height: 72,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: backgroundColor.withValues(alpha: 0.25),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                name,
                style: TextStyle(
                  color: textColor,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: tagColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  tag,
                  style: TextStyle(
                    color: tagTextColor,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),

          // Logo Pill
          Container(
            width: 48,
            height: 36,
            decoration: BoxDecoration(
              color: logoBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                logoText,
                style: TextStyle(
                  color: logoFg,
                  fontSize: isBoldLogo ? 16 : 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
