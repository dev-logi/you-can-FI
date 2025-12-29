/**
 * Main App Layout
 * 
 * Navigation for the main app after onboarding.
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useNetWorthStore } from '../../src/features/netWorth/store';

export default function MainLayout() {
  const refresh = useNetWorthStore((state) => state.refresh);

  useEffect(() => {
    refresh();
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
      <Stack.Screen name="assets" />
      <Stack.Screen name="liabilities" />
      <Stack.Screen name="connected-accounts" />
      <Stack.Screen 
        name="add-asset" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen 
        name="add-liability" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
    </Stack>
  );
}

