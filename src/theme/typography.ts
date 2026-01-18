/**
 * Jiggy Care Mobile - Modern Typography System
 * Font Families: SF Pro Display/Text (iOS-style) or Manrope (alternative)
 */

export const fontFamily = {
    // Primary font family - Choose one:
    // Option 1: Manrope (Modern, geometric, excellent for health/wellness)
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',

    // Option 2: Plus Jakarta Sans (Clean, professional, highly readable)
    // regular: 'PlusJakartaSans_400Regular',
    // medium: 'PlusJakartaSans_500Medium',
    // semiBold: 'PlusJakartaSans_600SemiBold',
    // bold: 'PlusJakartaSans_700Bold',
    // extraBold: 'PlusJakartaSans_800ExtraBold',

    // Option 3: DM Sans (Modern, versatile, great UI font)
    // regular: 'DMSans_400Regular',
    // medium: 'DMSans_500Medium',
    // semiBold: 'DMSans_700Bold',
    // bold: 'DMSans_700Bold',
};

export const fontSize = {
    // Display (Hero text)
    display: 40,

    // Headings
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    h5: 18,

    // Body
    bodyLarge: 17,
    body: 15,
    bodySmall: 14,

    // UI Elements
    label: 13,
    caption: 12,
    overline: 11,
    tiny: 10,
};

export const lineHeight = {
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
};

export const letterSpacing = {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.2,
};

export const fontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
};

// Pre-defined text styles for convenience
export const textStyles = {
    // Display text (hero sections)
    display: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.display,
        lineHeight: fontSize.display * lineHeight.tight,
        letterSpacing: letterSpacing.tighter,
    },

    // Headings
    h1: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.h1,
        lineHeight: fontSize.h1 * lineHeight.tight,
        letterSpacing: letterSpacing.tight,
    },
    h2: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.h2,
        lineHeight: fontSize.h2 * lineHeight.snug,
        letterSpacing: letterSpacing.tight,
    },
    h3: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.h3,
        lineHeight: fontSize.h3 * lineHeight.snug,
        letterSpacing: letterSpacing.normal,
    },
    h4: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.h4,
        lineHeight: fontSize.h4 * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    },
    h5: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.h5,
        lineHeight: fontSize.h5 * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    },

    // Body text
    bodyLarge: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.bodyLarge,
        lineHeight: fontSize.bodyLarge * lineHeight.relaxed,
        letterSpacing: letterSpacing.normal,
    },
    bodyLargeMedium: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.bodyLarge,
        lineHeight: fontSize.bodyLarge * lineHeight.relaxed,
        letterSpacing: letterSpacing.normal,
    },
    bodyLargeBold: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.bodyLarge,
        lineHeight: fontSize.bodyLarge * lineHeight.relaxed,
        letterSpacing: letterSpacing.normal,
    },
    body: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.body,
        lineHeight: fontSize.body * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    },
    bodyMedium: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.body,
        lineHeight: fontSize.body * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    },
    bodyBold: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.body,
        lineHeight: fontSize.body * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    },
    bodySmall: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.bodySmall,
        lineHeight: fontSize.bodySmall * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    },
    bodySmallMedium: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.bodySmall,
        lineHeight: fontSize.bodySmall * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    },

    // UI elements
    label: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.label,
        lineHeight: fontSize.label * lineHeight.normal,
        letterSpacing: letterSpacing.wide,
    },
    labelBold: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.label,
        lineHeight: fontSize.label * lineHeight.normal,
        letterSpacing: letterSpacing.wide,
    },
    caption: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.caption,
        lineHeight: fontSize.caption * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    },
    captionMedium: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.caption,
        lineHeight: fontSize.caption * lineHeight.normal,
        letterSpacing: letterSpacing.wide,
    },
    overline: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.overline,
        lineHeight: fontSize.overline * lineHeight.normal,
        letterSpacing: letterSpacing.widest,
        textTransform: 'uppercase' as const,
    },

    // Button text
    button: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.body,
        lineHeight: fontSize.body * lineHeight.snug,
        letterSpacing: letterSpacing.wide,
    },
    buttonLarge: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.bodyLarge,
        lineHeight: fontSize.bodyLarge * lineHeight.snug,
        letterSpacing: letterSpacing.wide,
    },
    buttonSmall: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.label,
        lineHeight: fontSize.label * lineHeight.snug,
        letterSpacing: letterSpacing.wide,
    },
};

export type TextStyle = keyof typeof textStyles;