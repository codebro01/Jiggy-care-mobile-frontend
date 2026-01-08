/**
 * Jiggy Care Mobile - Appointments Stack Navigator
 * Appointments → AppointmentDetail → Chat
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppointmentsStackParamList } from './types';
import { useAppTheme } from '../theme';

// Screens
import { AppointmentsScreen } from '../screens/appointments/AppointmentsScreen';
import { AppointmentDetailScreen } from '../screens/appointments/AppointmentDetailScreen';
import { ChatScreen } from '../screens/appointments/ChatScreen';

const Stack = createNativeStackNavigator<AppointmentsStackParamList>();

export function AppointmentsStack() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AppointmentsList" component={AppointmentsScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
