/**
 * Jiggy Care Mobile - Input Component
 * Text input with validation states and variants
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../theme';

type InputVariant = 'default' | 'filled';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  variant = 'default',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  ...textInputProps
}: InputProps) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const borderWidth = useSharedValue(1);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderWidth.value = withTiming(2, { duration: 150 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderWidth.value = withTiming(1, { duration: 150 });
  };

  const getBorderColor = () => {
    if (error) return theme.colors.palette.error[500];
    if (isFocused) return theme.colors.accent;
    return theme.colors.border.primary;
  };

  const getBackgroundColor = () => {
    if (variant === 'filled') {
      return theme.isDark ? theme.colors.surface.secondary : theme.colors.background.secondary;
    }
    return theme.colors.surface.primary;
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? theme.colors.palette.error[500] : theme.colors.text.secondary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.caption,
            },
          ]}
        >
          {label}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderRadius: theme.borderRadius.md,
          },
          animatedBorderStyle,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? theme.colors.accent : theme.colors.text.tertiary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          {...textInputProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !isPasswordVisible}
          placeholderTextColor={theme.colors.text.tertiary}
          style={[
            styles.input,
            {
              color: theme.colors.text.primary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.body,
            },
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
          ]}
        />
        
        {isPassword && (
          <Pressable onPress={togglePasswordVisibility} style={styles.rightIcon}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.text.tertiary}
            />
          </Pressable>
        )}
        
        {rightIcon && !isPassword && (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={theme.colors.text.tertiary}
            />
          </Pressable>
        )}
      </Animated.View>
      
      {(error || hint) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? theme.colors.palette.error[500] : theme.colors.text.tertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.caption,
            },
          ]}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    marginLeft: 12,
  },
  rightIcon: {
    padding: 12,
  },
  helperText: {
    marginTop: 4,
  },
});
