/**
 * Welcome Screen
 * 
 * First screen in onboarding flow.
 * Introduces the app and its purpose.
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { YStack, Text, XStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button } from '../../src/shared/components/index';
import { useOnboardingStore } from '../../src/features/onboarding/store';
import { QUESTION_IDS } from '../../src/features/onboarding/engine';

export default function WelcomeScreen() {
  const router = useRouter();
  const { answerQuestion, isLoading } = useOnboardingStore();

  const handleContinue = async () => {
    await answerQuestion(QUESTION_IDS.WELCOME, 'continue');
    router.push('/(onboarding)/household');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1} padding={24} justifyContent="space-between">
        {/* Header */}
        <YStack />

        {/* Content */}
        <YStack alignItems="center" gap={32}>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <YStack
              width={100}
              height={100}
              borderRadius={50}
              backgroundColor="#1e3a5f"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={48}>💰</Text>
            </YStack>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <YStack gap={16} alignItems="center">
              <Text
                fontSize={32}
                fontWeight="700"
                color="#2d3436"
                textAlign="center"
                fontFamily="$heading"
              >
                You Can FI
              </Text>
              <Text
                fontSize={18}
                color="#636e72"
                textAlign="center"
                lineHeight={26}
                maxWidth={300}
              >
                Let's get a clear picture of your finances and track your path to financial independence.
              </Text>
            </YStack>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).springify()}>
            <YStack gap={12} alignItems="center">
              <XStack gap={8} alignItems="center">
                <Text fontSize={14} color="#4a7c59">✓</Text>
                <Text fontSize={14} color="#636e72">Track your net worth</Text>
              </XStack>
              <XStack gap={8} alignItems="center">
                <Text fontSize={14} color="#4a7c59">✓</Text>
                <Text fontSize={14} color="#636e72">Monitor assets & liabilities</Text>
              </XStack>
              <XStack gap={8} alignItems="center">
                <Text fontSize={14} color="#4a7c59">✓</Text>
                <Text fontSize={14} color="#636e72">Private & offline-first</Text>
              </XStack>
            </YStack>
          </Animated.View>
        </YStack>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(800).springify()}>
          <YStack gap={16}>
            <Button
              variant="primary"
              fullWidth
              onPress={handleContinue}
              loading={isLoading}
            >
              Get Started
            </Button>
            <Text
              fontSize={12}
              color="#a0a0a0"
              textAlign="center"
            >
              Takes about 5 minutes
            </Text>
          </YStack>
        </Animated.View>
      </YStack>
    </SafeAreaView>
  );
}

