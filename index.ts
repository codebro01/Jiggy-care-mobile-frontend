import { registerRootComponent } from 'expo';

import notifee, { EventType } from '@notifee/react-native';

import App from './App';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (detail.notification?.id !== 'incoming_call') return;

  if (
    type === EventType.ACTION_PRESS &&
    detail.pressAction?.id === 'decline'
  ) {
    console.log('🔴 User declined call from notification in background');
    await notifee.cancelNotification('incoming_call');
  }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
