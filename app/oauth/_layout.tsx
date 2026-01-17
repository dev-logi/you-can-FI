/**
 * OAuth Routes Layout
 */

import { Stack } from 'expo-router';

export default function OAuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#faf8f5' },
      }}
    />
  );
}
