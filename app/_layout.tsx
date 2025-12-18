/**
 * Root Layout
 * 
 * This is the entry point for the app.
 * Handles:
 * - Tamagui provider setup
 * - API health check
 * - Navigation based on onboarding status
 */

import React, { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, YStack, Text, Spinner } from 'tamagui';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import config from '../tamagui.config';
import { OnboardingApiService } from '../src/api/services/onboardingService';
import { ApiClient } from '../src/api/client';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);
  const initialCheckDone = useRef(false);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  // Check API and onboarding status
  useEffect(() => {
    async function init() {
      try {
        // Check if API is healthy
        const isHealthy = await ApiClient.healthCheck();
        if (!isHealthy) {
          setApiError('Cannot connect to server. Please check your connection.');
          setIsReady(true);
          return;
        }

        // Check onboarding status
        // Default to showing onboarding if check fails (safer for new users)
        try {
          const complete = await OnboardingApiService.isComplete();
          setIsOnboardingComplete(complete);
        } catch (onboardingError) {
          console.error('Failed to check onboarding status:', onboardingError);
          // If onboarding check fails, default to showing onboarding
          setIsOnboardingComplete(false);
        }
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setApiError('Failed to connect to server.');
        setIsReady(true);
      }
    }

    if (fontsLoaded) {
      init();
    }
  }, [fontsLoaded]);

  // Handle navigation based on onboarding status
  // Only do initial navigation check once, then allow normal navigation
  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inMain = segments[0] === '(main)';

    // If this is the initial check, always enforce correct navigation
    if (!initialCheckDone.current) {
      if (isOnboardingComplete && inOnboarding) {
        // Onboarding complete but in onboarding section, go to main app
        router.replace('/(main)');
        initialCheckDone.current = true;
        return;
      } else if (!isOnboardingComplete && inMain) {
        // Onboarding not complete but in main app, go to onboarding
        router.replace('/(onboarding)');
        initialCheckDone.current = true;
        return;
      } else if (!isOnboardingComplete && !inOnboarding && !inMain) {
        // Onboarding not complete and no route selected, go to onboarding
        router.replace('/(onboarding)');
        initialCheckDone.current = true;
        return;
      } else if (isOnboardingComplete && !inMain && !inOnboarding) {
        // Onboarding complete and no route selected, go to main app
        router.replace('/(main)');
        initialCheckDone.current = true;
        return;
      }
      initialCheckDone.current = true;
    }
  }, [isReady, isOnboardingComplete, segments]);

  if (!fontsLoaded || !isReady) {
    return (
      <TamaguiProvider config={config}>
        <YStack flex={1} backgroundColor="#faf8f5" alignItems="center" justifyContent="center">
          <Spinner size="large" color="#1e3a5f" />
          <Text marginTop={16} color="#636e72">Loading...</Text>
        </YStack>
      </TamaguiProvider>
    );
  }

  if (apiError) {
    return (
      <TamaguiProvider config={config}>
        <YStack flex={1} backgroundColor="#faf8f5" alignItems="center" justifyContent="center" padding={24}>
          <Text fontSize={48} marginBottom={16}>⚠️</Text>
          <Text fontSize={18} fontWeight="600" color="#2d3436" textAlign="center" marginBottom={8}>
            Connection Error
          </Text>
          <Text fontSize={14} color="#636e72" textAlign="center">
            {apiError}
          </Text>
          <Text fontSize={12} color="#a0a0a0" textAlign="center" marginTop={24}>
            Make sure the backend server is running.
          </Text>
        </YStack>
      </TamaguiProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#faf8f5' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(main)" />
        </Stack>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

