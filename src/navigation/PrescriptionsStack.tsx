/**
 * Jiggy Care Mobile - Prescriptions Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PrescriptionsStackParamList } from './types';
import { useAppTheme } from '../theme';

// Screens
import { PrescriptionsScreen } from '../screens/prescriptions/PrescriptionsScreen';
import { CreatePrescriptionScreen } from '../screens/prescriptions/CreatePrescriptionScreen';

const Stack = createNativeStackNavigator<PrescriptionsStackParamList>();

export function PrescriptionsStack() {
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
      <Stack.Screen name="PrescriptionsList" component={PrescriptionsScreen} />
      <Stack.Screen 
        name="CreatePrescription" 
        component={CreatePrescriptionScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
