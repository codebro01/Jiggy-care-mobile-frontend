import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import { useAppTheme } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { Notification } from '../../types';
import { useNotificationStore } from '../../stores/notificationStore';
import { notificationService } from '../../services/notification.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationsScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Notifications'>;

interface Props {
  navigation: NotificationsScreenNavigationProp;
}

export function NotificationsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { notifications, setNotifications, unreadCount } = useNotificationStore();

  useEffect(() => {
    let eventSource: any;

    const setupStream = async () => {
      try {
        // Initial fetch
        const initialRes = await notificationService.getNotifications();
        if (initialRes.data) { // Assuming response structure, user didn't specify getNotifications response exactly but likely array or {data: []}
          // Adapting to likely structure or array based on backend sample which returns { data: { notifications: [] } } for stream but maybe array for REST.
          // Safe bet: check if array or property.
          const initialData = Array.isArray(initialRes.data) ? initialRes.data : initialRes.data.notifications || [];
          setNotifications(initialData);
        }

        // Start Stream
        eventSource = await notificationService.notificationStream((event) => {
          if (event.type === 'message' && event.data) {
            try {
              const parsed = JSON.parse(event.data);
              // Backend sends: { data: { notifications: [], count: n } }
              const newNotifications = parsed.data?.notifications || [];

              // Check for new notifications to trigger push
              // Simple check: if we have more notifications than before, or check IDs.
              // Since we might have read status changes, finding *new* unread items is key.
              // Logic: Find items in newNotifications not present in current notifications (by ID).
              // Access current state via store or ref? Store updates might be async/batched.
              // Better: usePrescriptionsStore.getState().notifications for comparison? Yes.

              const currentNotifs = useNotificationStore.getState().notifications;
              const newItems = newNotifications.filter((n: Notification) =>
                !currentNotifs.some(existing => existing.id === n.id)
              );

              if (newItems.length > 0) {
                newItems.forEach((item: Notification) => {
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: item.title,
                      body: item.body,
                      data: { id: item.id, type: item.type },
                    },
                    trigger: null, // Show immediately
                  });
                });
              }

              setNotifications(newNotifications);
            } catch (e) {
              console.error('Error parsing SSE message', e);
            }
          }
        });
      } catch (err) {
        console.error('Failed to setup notification stream', err);
      }
    };

    setupStream();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

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
        data={notifications}
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
