/**
 * Jiggy Care Mobile - Typography System
 * Font Family: Inter
 */

export const fontFamily = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
};

export const fontSize = {
    // Headings
    h1: 32,
    h2: 24,
    h3: 20,

    // Body
    bodyLarge: 16,
    body: 14,

    // Small text
    caption: 12,
    small: 10,
};

export const lineHeight = {
    heading: 1.2,
    body: 1.5,
};

export const letterSpacing = {
    heading: -0.5,
    body: 0,
};

// Pre-defined text styles for convenience
export const textStyles = {
    h1: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.h1,
        lineHeight: fontSize.h1 * lineHeight.heading,
        letterSpacing: letterSpacing.heading,
    },
    h2: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.h2,
        lineHeight: fontSize.h2 * lineHeight.heading,
        letterSpacing: letterSpacing.heading,
    },
    h3: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.h3,
        lineHeight: fontSize.h3 * lineHeight.heading,
        letterSpacing: letterSpacing.heading,
    },
    bodyLarge: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.bodyLarge,
        lineHeight: fontSize.bodyLarge * lineHeight.body,
        letterSpacing: letterSpacing.body,
    },
    body: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.body,
        lineHeight: fontSize.body * lineHeight.body,
        letterSpacing: letterSpacing.body,
    },
    bodyMedium: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.body,
        lineHeight: fontSize.body * lineHeight.body,
        letterSpacing: letterSpacing.body,
    },
    caption: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.caption,
        lineHeight: fontSize.caption * lineHeight.body,
        letterSpacing: letterSpacing.body,
    },
    small: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.small,
        lineHeight: fontSize.small * lineHeight.body,
        letterSpacing: letterSpacing.body,
    },
};

export type TextStyle = keyof typeof textStyles;
