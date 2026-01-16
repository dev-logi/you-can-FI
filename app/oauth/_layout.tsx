/**
 * OAuth Routes Layout
 * 
 * Simple layout for OAuth callback screens.
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
