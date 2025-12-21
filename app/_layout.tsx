/**
 * Root Layout
 * 
 * This is the entry point for the app.
 * Handles:
 * - Tamagui provider setup
 * - Authentication state
 * - API health check
 * - Navigation based on auth and onboarding status
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
import { useAuthStore } from '../src/features/auth/store';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);
  const initialCheckDone = useRef(false);

  // Auth state
  const { user, session, isInitialized, initialize } = useAuthStore();

  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  // Initialize auth and check API/onboarding status
  useEffect(() => {
    async function init() {
      try {
        // Initialize auth first
        await initialize();

        // Get the latest auth state after initialization
        const authState = useAuthStore.getState();
        const currentSession = authState.session;
        const currentUser = authState.user;

        // Set auth token in API client if user is authenticated
        if (currentSession?.access_token) {
          ApiClient.setAuthToken(currentSession.access_token);
        }

        // Check if API is healthy (non-blocking for unauthenticated users)
        // Allow app to load even if API is down, so users can at least see login screen
        const isHealthy = await ApiClient.healthCheck();
        if (!isHealthy) {
          // Only show error if user is authenticated (they need the API)
          // For unauthenticated users, allow them to see login screen
          if (currentUser) {
            setApiError('Cannot connect to server. Please check your connection.');
            setIsReady(true);
            return;
          }
          // For unauthenticated users, continue without API check
          // They can still see login screen
        }

        // Only check onboarding if user is authenticated
        if (currentUser) {
          try {
            const complete = await OnboardingApiService.isComplete();
            setIsOnboardingComplete(complete);
          } catch (onboardingError) {
            console.error('Failed to check onboarding status:', onboardingError);
            setIsOnboardingComplete(false);
          }
        }
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Don't block app loading on error - allow login screen to show
        // Only set error if user is authenticated
        const authState = useAuthStore.getState();
        if (authState.user) {
          setApiError('Failed to connect to server.');
        }
        setIsReady(true);
      }
    }

    if (fontsLoaded) {
      init();
    }
  }, [fontsLoaded]);

  // Update API client token when session changes
  useEffect(() => {
    if (session?.access_token) {
      ApiClient.setAuthToken(session.access_token);
    } else {
      ApiClient.clearAuthToken();
    }
  }, [session]);

  // Handle navigation based on auth and onboarding status
  useEffect(() => {
    if (!isReady) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inMain = segments[0] === '(main)';
    // Check if at root - segments will be empty array or just contain 'index'
    // Also check if pathname is '/' (for web)
    const atRoot = segments.length === 0 || 
                   (segments.length === 1 && segments[0] === 'index') || 
                   (typeof window !== 'undefined' && window.location.pathname === '/');

    console.log('[Navigation] Checking navigation:', {
      user: !!user,
      isOnboardingComplete,
      segments,
      inAuth,
      inOnboarding,
      inMain,
      atRoot,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
    });

    // If not authenticated, go to auth (unless already in auth)
    if (!user && !inAuth) {
      console.log('[Navigation] Not authenticated, redirecting to login');
      router.replace('/(auth)/login');
      return;
    }

    // If authenticated, handle onboarding/main navigation
    if (user) {
      // If authenticated user is in auth section, redirect them away
      if (inAuth) {
        if (isOnboardingComplete) {
          console.log('[Navigation] Authenticated user in auth, redirecting to main');
          router.replace('/(main)');
        } else {
          console.log('[Navigation] Authenticated user in auth, redirecting to onboarding');
          router.replace('/(onboarding)');
        }
        return;
      }

      // If already in correct section, do nothing (check this first to avoid unnecessary redirects)
      if ((isOnboardingComplete && inMain) || (!isOnboardingComplete && inOnboarding)) {
        console.log('[Navigation] Already in correct section, no redirect needed');
        return;
      }

      // If onboarding complete, ensure we're in main section (not in onboarding or at root)
      if (isOnboardingComplete && (inOnboarding || atRoot)) {
        console.log('[Navigation] Onboarding complete, redirecting to main');
        router.replace('/(main)');
        return;
      }

      // If onboarding not complete, ensure we're in onboarding section (not in main or at root)
      if (!isOnboardingComplete && (inMain || atRoot)) {
        console.log('[Navigation] Onboarding not complete, redirecting to onboarding');
        router.replace('/(onboarding)');
        return;
      }
    }
  }, [isReady, user, isOnboardingComplete, segments, router]);

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
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(main)" />
        </Stack>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

