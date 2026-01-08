/**
 * Jiggy Care Mobile - Tab Navigator
 * Bottom tab navigation with floating tab bar
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useAppTheme } from '../theme';
import { MainTabParamList } from './types';

// Import Stacks
import { HomeStack } from './HomeStack';
import { AppointmentsStack } from './AppointmentsStack';
import { PrescriptionsStack } from './PrescriptionsStack';
import { ProfileStack } from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  iconNameOutline: keyof typeof Ionicons.glyphMap;
}

function TabIcon({ focused, iconName, iconNameOutline }: TabIconProps) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 15,
      stiffness: 300,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={focused ? iconName : iconNameOutline}
        size={24}
        color={focused ? theme.colors.accent : theme.colors.text.tertiary}
      />
    </Animated.View>
  );
}

export function TabNavigator() {
  const theme = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily.medium,
          fontSize: 11,
          marginTop: -4,
        },
        tabBarStyle: {
          position: 'absolute',
          height: theme.tabBar.height,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          backgroundColor: theme.isDark 
            ? 'rgba(15, 15, 15, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          ...theme.shadows.lg,
          elevation: 0,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={theme.isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName="home"
              iconNameOutline="home-outline"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName="calendar"
              iconNameOutline="calendar-outline"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Prescriptions"
        component={PrescriptionsStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName="medical"
              iconNameOutline="medical-outline"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName="person"
              iconNameOutline="person-outline"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
