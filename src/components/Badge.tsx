/**
 * Jiggy Care Mobile - Badge Component
 * Notification badge and status badges
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';

type BadgeVariant = 'notification' | 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  count?: number;
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  maxCount?: number;
  style?: ViewStyle;
}

export function Badge({
  count,
  label,
  variant = 'notification',
  size = 'md',
  maxCount = 99,
  style,
}: BadgeProps) {
  const theme = useAppTheme();

  // Don't render if count is 0 and no label
  if (!label && (count === undefined || count === 0)) return null;

  const getBackgroundColor = () => {
    switch (variant) {
      case 'notification':
        return theme.colors.palette.error[500];
      case 'success':
        return theme.colors.palette.success[500];
      case 'warning':
        return theme.colors.palette.warning[500];
      case 'error':
        return theme.colors.palette.error[500];
      case 'info':
        return theme.colors.palette.primary[500];
      case 'default':
        return theme.colors.palette.gray[500];
      default:
        return theme.colors.palette.error[500];
    }
  };

  const getSizeStyles = (): ViewStyle => {
    if (size === 'sm') {
      return {
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        borderRadius: 8,
      };
    }
    return {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
    };
  };

  const getFontSize = () => {
    return size === 'sm' ? 10 : 11;
  };

  const displayText = label
    ? label
    : count !== undefined
    ? count > maxCount
      ? `${maxCount}+`
      : count.toString()
    : '';

  return (
    <View
      style={[
        styles.badge,
        getSizeStyles(),
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: getFontSize(),
            fontFamily: theme.fontFamily.semiBold,
          },
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
}

// Status Badge - for appointment statuses
type StatusBadgeStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: StatusBadgeStatus;
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const theme = useAppTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          backgroundColor: theme.colors.palette.warning[100],
          textColor: theme.colors.palette.warning[700],
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          backgroundColor: theme.colors.palette.success[100],
          textColor: theme.colors.palette.success[700],
        };
      case 'completed':
        return {
          label: 'Completed',
          backgroundColor: theme.colors.palette.primary[100],
          textColor: theme.colors.palette.primary[700],
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          backgroundColor: theme.colors.palette.error[100],
          textColor: theme.colors.palette.error[700],
        };
      default:
        return {
          label: status,
          backgroundColor: theme.colors.palette.gray[100],
          textColor: theme.colors.palette.gray[700],
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: config.backgroundColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          {
            color: config.textColor,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.small,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    textTransform: 'capitalize',
  },
});
