/**
 * Jiggy Care Mobile - Card Component
 * Interactive card with press animations and shadow
 */

import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Card({
  children,
  variant = 'elevated',
  onPress,
  style,
  disabled = false,
}: CardProps) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      elevation.value,
      [0, 1],
      [0.08, 0.15]
    );

    return {
      transform: [{ scale: scale.value }],
      shadowOpacity,
    };
  });

  const handlePressIn = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      elevation.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    elevation.value = withSpring(0, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.surface.elevated,
          ...theme.shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.surface.primary,
          borderWidth: 1,
          borderColor: theme.colors.border.primary,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.surface.secondary,
        };
      default:
        return {};
    }
  };

  const Container = onPress ? AnimatedPressable : Animated.View;

  return (
    <Container
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      onPress={onPress ? handlePress : undefined}
      disabled={disabled}
      style={[
        styles.card,
        { borderRadius: theme.borderRadius.xl },
        getVariantStyles(),
        disabled && styles.disabled,
        onPress ? animatedStyle : undefined,
        style,
      ]}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.6,
  },
});
