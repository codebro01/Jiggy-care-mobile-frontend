/**
 * Jiggy Care Mobile - EmptyState Component
 * Empty state with illustration and action button
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon = 'document-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.isDark
              ? theme.colors.surface.secondary
              : theme.colors.palette.primary[50],
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={48}
          color={theme.colors.accent}
        />
      </View>
      
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text.primary,
            fontFamily: theme.fontFamily.semiBold,
            fontSize: theme.fontSize.h3,
          },
        ]}
      >
        {title}
      </Text>
      
      {description && (
        <Text
          style={[
            styles.description,
            {
              color: theme.colors.text.secondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.body,
            },
          ]}
        >
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  button: {
    marginTop: 24,
  },
});
