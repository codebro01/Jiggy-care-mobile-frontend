/**
 * Jiggy Care Mobile - Theme Context
 * Provides theme management with dark mode support
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, ThemeColors, colors } from './colors';
import { textStyles, fontFamily, fontSize } from './typography';
import { spacing, borderRadius, shadows, screenPadding, tabBar, avatarSizes, animationDuration, buttonScale } from './spacing';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface Theme {
  colors: ThemeColors & {
    palette: typeof colors;
  };
  textStyles: typeof textStyles;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  screenPadding: typeof screenPadding;
  tabBar: typeof tabBar;
  avatarSizes: typeof avatarSizes;
  animationDuration: typeof animationDuration;
  buttonScale: typeof buttonScale;
  isDark: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode = 'auto' }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode);

  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const themeColors = isDark ? darkTheme : lightTheme;

  const theme: Theme = {
    colors: {
      ...themeColors,
      palette: colors,
    },
    textStyles,
    fontFamily,
    fontSize,
    spacing,
    borderRadius,
    shadows,
    screenPadding,
    tabBar,
    avatarSizes,
    animationDuration,
    buttonScale,
    isDark,
  };

  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      // If auto, switch to the opposite of current system theme
      return systemColorScheme === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Convenience hook for just the theme object
export function useAppTheme(): Theme {
  const { theme } = useTheme();
  return theme;
}
