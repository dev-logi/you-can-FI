/**
 * Root Layout
 * 
 * This is the entry point for the app.
 * Handles:
 * - Tamagui provider setup
 * - API health check
 * - Navigation based on onboarding status
 */

import React, { useEffect, useState } from 'react';
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
        const complete = await OnboardingApiService.isComplete();
        setIsOnboardingComplete(complete);
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
  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inMain = segments[0] === '(main)';

    if (isOnboardingComplete && !inMain) {
      // Onboarding complete, go to main app
      router.replace('/(main)');
    } else if (!isOnboardingComplete && !inOnboarding) {
      // Onboarding not complete, go to onboarding
      router.replace('/(onboarding)');
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

