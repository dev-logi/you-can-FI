/**
 * Email Verification Screen
 * 
 * Shown after signup when email confirmation is required.
 * Allows users to resend confirmation email.
 */

import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card } from '@/shared/components';
import { useAuthStore } from '@/features/auth/store';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { resendConfirmationEmail, isLoading, error, clearError } = useAuthStore();
  
  const email = (params.email as string) || '';
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    
    setResendSuccess(false);
    clearError();
    
    const { error: resendError } = await resendConfirmationEmail(email);
    
    if (!resendError) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    }
  };

  const handleOpenEmail = () => {
    // Try to open default email app
    Linking.openURL('mailto:');
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
            <YStack gap={24} marginTop={40} alignItems="center">
              <YStack gap={8} alignItems="center">
                <Text fontSize={48}>📧</Text>
                <Text fontSize={32} fontWeight="700" color="#2d3436" fontFamily="$heading" textAlign="center">
                  Check Your Email
                </Text>
                <Text fontSize={16} color="#636e72" textAlign="center" maxWidth={300}>
                  We've sent a confirmation email to
                </Text>
                <Text fontSize={16} fontWeight="600" color="#1e3a5f" textAlign="center">
                  {email}
                </Text>
              </YStack>

              <Card>
                <YStack gap={16} padding={20}>
                  <Text fontSize={14} color="#636e72" textAlign="center">
                    Please click the confirmation link in the email to verify your account and continue.
                  </Text>
                  
                  <YStack gap={12}>
                    <Text fontSize={14} fontWeight="600" color="#2d3436">
                      Didn't receive the email?
                    </Text>
                    <Text fontSize={14} color="#636e72">
                      • Check your spam/junk folder
                    </Text>
                    <Text fontSize={14} color="#636e72">
                      • Make sure you entered the correct email address
                    </Text>
                    <Text fontSize={14} color="#636e72">
                      • Wait a few minutes and try resending
                    </Text>
                  </YStack>
                </YStack>
              </Card>

              {error && (
                <Card variant="warning">
                  <Text color="#d4a84b" fontSize={14} textAlign="center">
                    {error}
                  </Text>
                </Card>
              )}

              {resendSuccess && (
                <Card variant="success">
                  <Text color="#4a7c59" fontSize={14} textAlign="center">
                    ✓ Confirmation email sent! Please check your inbox.
                  </Text>
                </Card>
              )}

              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <YStack gap={16} marginTop={8} width="100%">
                  <Button
                    variant="primary"
                    fullWidth
                    onPress={handleResend}
                    loading={isLoading}
                    disabled={!email}
                  >
                    Resend Confirmation Email
                  </Button>

                  <Button
                    variant="ghost"
                    fullWidth
                    onPress={handleOpenEmail}
                  >
                    Open Email App
                  </Button>

                  <XStack justifyContent="center" alignItems="center" gap={8} marginTop={8}>
                    <Text fontSize={14} color="#636e72">
                      Already confirmed?
                    </Text>
                    <Pressable onPress={() => router.replace('/(auth)/login')}>
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

