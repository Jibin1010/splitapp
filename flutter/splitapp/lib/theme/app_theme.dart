import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Tubik Design System Colors for AI-Powered Operations & Bill Splitting
/// Derived directly from:
/// https://dribbble.com/shots/26787072-AI-Powered-Mobile-App-for-Restaurant-Operations
class AppColors {
  // Tubik Core Canvas & Dark Backgrounds
  static const Color canvasFrame = Color(0xFFD4DEC8); // Soft sage/olive presentation canvas
  static const Color background = Color(0xFF101314); // Deep matte obsidian/charcoal
  static const Color surface = Color(0xFF181D1C); // Sleek dark card container
  static const Color surfaceElevated = Color(0xFF222826); // Nested dark surface
  static const Color surfaceSubtle = Color(0xFF141716); // Ultra subtle dark
  static const Color border = Color(0xFF2C3431); // Refined micro border
  static const Color borderSubtle = Color(0xFF202624);

  // Tubik High-Contrast Accent System
  static const Color coral = Color(0xFFFF6E53); // Signature Coral / Peach-Orange
  static const Color coralDark = Color(0xFFE05238);
  static const LinearGradient coralGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF7257), Color(0xFFF06548), Color(0xFFD64428)],
  );

  static const Color electricIris = Color(0xFF6355F6); // Vibrant Iris / Indigo
  static const Color electricIrisDark = Color(0xFF5041E6);
  static const LinearGradient irisGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF6F61FF), Color(0xFF5847EE)],
  );

  static const Color honeyYellow = Color(0xFFF5C443); // Warm Sand / Honey Amber (Head Payer & FAB)
  static const Color honeyAmber = honeyYellow;
  static const Color honeyDark = Color(0xFFDDA823);
  static const Color coralRed = coral;

  static const Color mintSage = Color(0xFFC2DFC8); // Mint / Soft Sage Green (Settled & Verification)
  static const Color mintDark = Color(0xFF4C855B);

  static const Color iceCyan = Color(0xFF9BE7FF); // Ice Cyan (AI Chips & Pills)
  static const Color iceCyanDark = Color(0xFF007A99);

  // Backward compatibility with previous theme references
  static const Color primary = electricIris;
  static const Color primaryDark = electricIrisDark;
  static const Color primaryLight = Color(0xFF8B80FF);
  static const Color primarySubtle = Color(0x2A6355F6);

  // Text Hierarchy
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFA1ABA7);
  static const Color textMuted = Color(0xFF687470);

  // Semantic Status
  static const Color success = Color(0xFF34D399);
  static const Color successSubtle = Color(0x2034D399);
  static const Color warning = honeyYellow;
  static const Color warningSubtle = Color(0x25F5C443);
  static const Color danger = Color(0xFFFF5252);
  static const Color dangerSubtle = Color(0x25FF5252);

  // Light theme complements (if needed)
  static const Color lightBackground = Color(0xFFF5F7F6);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceElevated = Color(0xFFEAEFEB);
  static const Color lightBorder = Color(0xFFDCE2DF);
  static const Color lightTextPrimary = Color(0xFF101314);
  static const Color lightTextSecondary = Color(0xFF5A6662);
}

class AppTheme {
  static ThemeData get darkTheme {
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme(ThemeData.dark().textTheme);

    return ThemeData(
      useMaterial3: true,
      splashFactory: InkRipple.splashFactory,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primary,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.coral,
        tertiary: AppColors.honeyYellow,
        surface: AppColors.surface,
        error: AppColors.danger,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
        onError: Colors.white,
      ),
      textTheme: baseTextTheme.copyWith(
        displaySmall: baseTextTheme.displaySmall?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w800,
          letterSpacing: -1.0,
        ),
        headlineMedium: baseTextTheme.headlineMedium?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        titleLarge: baseTextTheme.titleLarge?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
        titleMedium: baseTextTheme.titleMedium?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(
          color: AppColors.textPrimary,
        ),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(
          color: AppColors.textSecondary,
        ),
        bodySmall: baseTextTheme.bodySmall?.copyWith(
          color: AppColors.textMuted,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.border, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceElevated,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surface,
        elevation: 12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
          side: const BorderSide(color: AppColors.border, width: 1.2),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: 1,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          side: const BorderSide(color: AppColors.border, width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
      ),
    );
  }
}
