/**
 * Jiggy Care Mobile - Splash Screen
 * Animated splash with logo and gradient background
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export function SplashScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const navigateToLogin = () => {
    navigation.replace('Login');
  };

  useEffect(() => {
    // Logo animation
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 600 }),
      withTiming(1, { duration: 200 })
    );
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Text animation
    textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));

    // Navigate after animation
    const timer = setTimeout(() => {
      runOnJS(navigateToLogin)();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <LinearGradient
      colors={[theme.colors.palette.primary[600], theme.colors.palette.primary[400]]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={styles.iconCircle}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />        </View>
      </Animated.View>

      <Animated.View style={textAnimatedStyle}>
        <Text style={[styles.title, { fontFamily: theme.fontFamily.bold }]}>
          Jigicare
        </Text>
        <Text style={[styles.subtitle, { fontFamily: theme.fontFamily.regular }]}>
          Healthcare Consultant
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  logoImage: {
    width: 64,
    height: 64,
  },
});
