/**
 * Jiggy Care Mobile - Notifications Screen
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { Notification } from '../../types';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Notifications'>;

interface Props {
  navigation: NotificationsScreenNavigationProp;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Appointment',
    body: 'Victor Damilola has booked an appointment for tomorrow at 10:00 AM',
    type: 'appointment',
    referenceId: 'a1',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    title: 'Message Received',
    body: 'You have a new message from Sarah Williams',
    type: 'message',
    referenceId: 'c1',
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    title: 'Appointment Reminder',
    body: 'You have an appointment with Michael Brown in 1 hour',
    type: 'appointment',
    referenceId: 'a2',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function NotificationsScreen({ navigation }: Props) {
  const theme = useAppTheme();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment':
        return 'calendar';
      case 'message':
        return 'chatbubble';
      case 'prescription':
        return 'medical';
      default:
        return 'notifications';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.read
            ? theme.colors.surface.primary
            : theme.isDark
            ? theme.colors.palette.primary[900]
            : theme.colors.palette.primary[50],
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.isDark
              ? theme.colors.surface.secondary
              : theme.colors.palette.primary[100],
          },
        ]}
      >
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={20}
          color={theme.colors.accent}
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text
          style={[
            styles.notificationTitle,
            {
              color: theme.colors.text.primary,
              fontFamily: theme.fontFamily.semiBold,
            },
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.notificationBody,
            {
              color: theme.colors.text.secondary,
              fontFamily: theme.fontFamily.regular,
            },
          ]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text
          style={[
            styles.notificationTime,
            {
              color: theme.colors.text.tertiary,
              fontFamily: theme.fontFamily.medium,
            },
          ]}
        >
          {getTimeAgo(item.createdAt)}
        </Text>
      </View>
      
      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: theme.colors.accent }]} />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.colors.surface.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text
          style={[
            styles.title,
            { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          Notifications
        </Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
  },
  placeholder: {
    width: 44,
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: 'center',
  },
});
