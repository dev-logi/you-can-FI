/**
 * OAuth Callback Screen
 * 
 * Pass-through screen for Plaid OAuth redirect.
 * The Plaid SDK handles the OAuth state automatically in the background.
 * This screen just shows a loading state and navigates to dashboard.
 */

import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, Text, Spinner } from 'tamagui';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ oauth_state_id?: string }>();

  useEffect(() => {
    // Navigate to dashboard after a brief delay
    // The Plaid SDK detects the URL and resumes automatically in the background
    const timer = setTimeout(() => {
      router.replace('/(main)');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <YStack flex={1} backgroundColor="#faf8f5" alignItems="center" justifyContent="center" padding={24}>
      <Spinner size="large" color="#1e3a5f" />
      <Text fontSize={18} fontWeight="600" color="#2d3436" marginTop={24} textAlign="center">
        Completing Connection...
      </Text>
      <Text fontSize={14} color="#636e72" marginTop={8} textAlign="center">
        Please wait while we finish linking your account.
      </Text>
    </YStack>
  );
}
