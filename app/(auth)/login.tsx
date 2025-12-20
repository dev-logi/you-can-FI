/**
 * Login Screen
 * 
 * Allows users to sign in with email and password.
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Input, Card } from '../../src/shared/components';
import { useAuthStore } from '../../src/features/auth/store';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    setLocalError(null);
    clearError();

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setLocalError(signInError.message);
    } else {
      // Navigation will be handled by root layout when auth state changes
      router.replace('/(onboarding)');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
      >
        <ScrollView
          flex={1}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <YStack gap={24} marginTop={40}>
              <YStack gap={8}>
                <Text fontSize={32} fontWeight="700" color="#2d3436" fontFamily="$heading">
                  Welcome Back
                </Text>
                <Text fontSize={16} color="#636e72">
                  Sign in to continue tracking your finances
                </Text>
              </YStack>

              <YStack gap={20} marginTop={24}>
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              </YStack>

              {(localError || error) && (
                <Card variant="warning">
                  <Text color="#d4a84b" fontSize={14}>
                    {localError || error}
                  </Text>
                </Card>
              )}

              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <YStack gap={16} marginTop={8}>
                  <Button
                    variant="primary"
                    fullWidth
                    onPress={handleLogin}
                    loading={isLoading}
                    disabled={!email || !password}
                  >
                    Sign In
                  </Button>

                  <XStack justifyContent="center" alignItems="center" gap={8}>
                    <Text fontSize={14} color="#636e72">
                      Don't have an account?
                    </Text>
                    <Pressable onPress={() => router.push('/(auth)/signup')}>
                      <Text fontSize={14} color="#1e3a5f" fontWeight="600">
                        Sign Up
                      </Text>
                    </Pressable>
                  </XStack>
                </YStack>
              </Animated.View>
            </YStack>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

