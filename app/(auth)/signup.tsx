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
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Input, Card } from '@/shared/components';
import { useAuthStore } from '@/features/auth/store';
import { ApiClient } from '@/api/client';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

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
    setNeedsEmailConfirmation(false);

    const { error: signUpError, needsEmailConfirmation: needsConfirmation } = await signUp(email, password);

    if (signUpError) {
      setLocalError(signUpError.message);
    } else if (needsConfirmation) {
      // Email confirmation required - navigate to verification screen
      setNeedsEmailConfirmation(true);
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email },
      });
    } else {
      // Session available - user can proceed directly
      // Wait for session to be available (Supabase might need a moment to set it)
      let sessionAvailable = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const authState = useAuthStore.getState();
        if (authState.session?.access_token) {
          ApiClient.setAuthToken(authState.session.access_token);
          console.log('[SignUp] API client token set successfully');
          sessionAvailable = true;
          break;
        }
      }

      if (!sessionAvailable) {
        console.warn('[SignUp] No session available after signup - will be set by auth state listener');
      }

      // Navigation will be handled by root layout when auth state changes
      router.replace('/(onboarding)');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          flex={1}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <YStack gap={32} alignItems="center">
              {/* Header - Outside Card */}
              <YStack gap={8} alignItems="center">
                <Text fontSize={32} fontWeight="700" color="white" fontFamily="$heading" textAlign="center">
                  Create Account
                </Text>
                <Text fontSize={16} color="rgba(255,255,255,0.9)" textAlign="center">
                  Sign up to start tracking your finances
                </Text>
              </YStack>

              {/* Card - White Background */}
              <Card width="100%" padding={24} borderRadius={16} backgroundColor="white" shadowColor="rgba(0,0,0,0.2)" shadowRadius={20} shadowOpacity={0.5}>
                <YStack gap={20}>
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

                  {(localError || error) && (
                    <YStack padding={12} backgroundColor="#fff4f4" borderRadius={8} borderWidth={1} borderColor="#ffcccc">
                      <Text color="#c75c5c" fontSize={14}>
                        {localError || error}
                      </Text>
                    </YStack>
                  )}

                  <YStack gap={12} marginTop={8}>
                    <Button
                      variant="primary"
                      fullWidth
                      onPress={handleSignUp}
                      loading={isLoading}
                      disabled={!email || !password || !confirmPassword}
                      style={{ backgroundColor: '#1e3a5f' }}
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
                </YStack>
              </Card>
            </YStack>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

