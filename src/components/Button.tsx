/**
 * Jiggy Care Mobile - Button Component
 * Animated button with haptic feedback and multiple variants
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  AnimatedProps,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable) as React.ComponentType<AnimatedProps<PressableProps>>;

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(theme.buttonScale.pressed, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(theme.buttonScale.normal, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const baseStyles = {
      primary: {
        container: {
          backgroundColor: theme.colors.accent,
        },
        text: {
          color: '#FFFFFF',
        },
      },
      secondary: {
        container: {
          backgroundColor: theme.colors.accentSecondary,
        },
        text: {
          color: '#FFFFFF',
        },
      },
      outline: {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.accent,
        },
        text: {
          color: theme.colors.accent,
        },
      },
      text: {
        container: {
          backgroundColor: 'transparent',
        },
        text: {
          color: theme.colors.accent,
        },
      },
      danger: {
        container: {
          backgroundColor: theme.colors.palette.error[500],
        },
        text: {
          color: '#FFFFFF',
        },
      },
    };

    return baseStyles[variant];
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    const sizes = {
      sm: {
        container: {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
        },
        text: {
          fontSize: theme.fontSize.caption,
        },
      },
      md: {
        container: {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
        },
        text: {
          fontSize: theme.fontSize.body,
        },
      },
      lg: {
        container: {
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.borderRadius.lg,
        },
        text: {
          fontSize: theme.fontSize.bodyLarge,
        },
      },
    };

    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variantStyles.text,
              icon && iconPosition === 'left' ? styles.textWithLeftIcon : null,
              icon && iconPosition === 'right' ? styles.textWithRightIcon : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  textWithLeftIcon: {
    marginLeft: 8,
  },
  textWithRightIcon: {
    marginRight: 8,
  },
});
