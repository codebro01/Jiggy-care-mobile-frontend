/**
 * Jiggy Care Mobile - Spacing & Layout System
 */

// Spacing scale (in pixels)
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
} as const;

// Screen padding
export const screenPadding = {
    horizontal: spacing.lg,
    vertical: spacing.xl,
};

// Border radius
export const borderRadius = {
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
    '2xl': 18, // Chat bubbles
    '3xl': 24, // Modals (top corners)
    full: 9999,
};

// Shadows for light mode
export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
};

// Tab bar dimensions
export const tabBar = {
    height: 80,
    iconSize: 24,
    labelSize: 12,
};

// Avatar sizes
export const avatarSizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
    '2xl': 120,
};

// Touch target minimum
export const minTouchTarget = 44;

// Animation durations (ms)
export const animationDuration = {
    fast: 150,
    normal: 300,
    slow: 500,
};

// Button scales for press animations
export const buttonScale = {
    pressed: 0.96,
    normal: 1,
};

export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
