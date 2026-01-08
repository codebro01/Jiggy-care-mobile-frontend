/**
 * Jiggy Care Mobile - Avatar Component
 * Circular avatar with fallback initials and status indicator
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  showStatus?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  source,
  name,
  size = 'md',
  showStatus = false,
  isOnline = false,
  style,
}: AvatarProps) {
  const theme = useAppTheme();
  const avatarSize = theme.avatarSizes[size];

  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getStatusSize = (): number => {
    switch (size) {
      case 'sm': return 8;
      case 'md': return 10;
      case 'lg': return 14;
      case 'xl': return 16;
      case '2xl': return 20;
      default: return 10;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm': return 12;
      case 'md': return 14;
      case 'lg': return 20;
      case 'xl': return 28;
      case '2xl': return 40;
      default: return 14;
    }
  };

  const statusSize = getStatusSize();

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: theme.colors.palette.primary[100],
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              color: theme.colors.palette.primary[600],
              fontSize: getFontSize(),
              fontFamily: theme.fontFamily.semiBold,
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      )}
      
      {showStatus && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              backgroundColor: isOnline
                ? theme.colors.palette.success[500]
                : theme.colors.palette.gray[400],
              borderColor: theme.colors.surface.primary,
              borderWidth: 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
