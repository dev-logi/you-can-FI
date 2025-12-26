/**
 * Onboarding Layout
 * 
 * Handles navigation within the onboarding flow.
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useOnboardingStore } from '../../src/features/onboarding/store';

export default function OnboardingLayout() {
  const init = useOnboardingStore((state) => state.init);

  useEffect(() => {
    init();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#faf8f5' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="household" />
      <Stack.Screen name="assets/cash" />
      <Stack.Screen name="assets/retirement" />
      <Stack.Screen name="assets/investments" />
      <Stack.Screen name="assets/real-estate" />
      <Stack.Screen name="assets/vehicles" />
      <Stack.Screen name="assets/other" />
      <Stack.Screen name="liabilities/mortgages" />
      <Stack.Screen name="liabilities/credit-cards" />
      <Stack.Screen name="liabilities/auto-loans" />
      <Stack.Screen name="liabilities/student-loans" />
      <Stack.Screen name="liabilities/other" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="review" />
    </Stack>
  );
}

