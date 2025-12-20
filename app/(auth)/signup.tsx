/**
 * Sign Up Screen
 * 
 * Allows new users to create an account with email and password.
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Input, Card } from '../../../src/shared/components';
import { useAuthStore } from '../../../src/features/auth/store';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setLocalError(null);
    clearError();

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setLocalError(signUpError.message);
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
                  Create Account
                </Text>
                <Text fontSize={16} color="#636e72">
                  Sign up to start tracking your finances
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
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  helperText="Must be at least 6 characters"
                />

                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
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
                    onPress={handleSignUp}
                    loading={isLoading}
                    disabled={!email || !password || !confirmPassword}
                  >
                    Create Account
                  </Button>

                  <XStack justifyContent="center" alignItems="center" gap={8}>
                    <Text fontSize={14} color="#636e72">
                      Already have an account?
                    </Text>
                    <Pressable onPress={() => router.push('/(auth)/login')}>
                      <Text fontSize={14} color="#1e3a5f" fontWeight="600">
                        Sign In
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

