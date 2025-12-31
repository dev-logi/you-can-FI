/**
 * Welcome Screen
 * 
 * First screen in onboarding flow.
 * Introduces the app and its purpose.
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { YStack, Text, XStack } from 'tamagui';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, Card } from '../../src/shared/components';
import { useOnboardingStore } from '../../src/features/onboarding/store';
import { QUESTION_IDS } from '../../src/features/onboarding/engine';

export default function WelcomeScreen() {
  const router = useRouter();
  const { answerQuestion, isLoading } = useOnboardingStore();
  const insets = useSafeAreaInsets();

  const handleContinue = async () => {
    await answerQuestion(QUESTION_IDS.WELCOME, 'continue');
    router.push('/(onboarding)/household');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1}>
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <YStack alignItems="center" gap={32} justifyContent="center" minHeight={400}>
            <Animated.View entering={FadeInDown.delay(200).springify()} style={{ width: '100%' }}>
              <YStack gap={24}>
                <YStack gap={8} alignItems="center">
                  <Text fontSize={32} fontWeight="700" color="#2d3436" fontFamily="$heading">
                    Welcome! 👋
                  </Text>
                  <Text fontSize={16} color="#636e72">
                    Let's discover your net worth
                  </Text>
                </YStack>

                <Card padding={24}>
                  <YStack alignItems="center" gap={24}>
                    <Text fontSize={70}>💰</Text>

                    <YStack gap={8} alignItems="center">
                      <Text fontSize={18} fontWeight="600" color="#2d3436">
                        Your Financial Snapshot
                      </Text>
                      <Text fontSize={14} color="#636e72" textAlign="center">
                        Quick discovery process to understand your complete financial picture.
                      </Text>
                    </YStack>

                    <YStack width="100%" gap={8}>
                      <XStack backgroundColor="#f8f9fa" padding={12} borderRadius={8} gap={10} alignItems="center">
                        <Text fontSize={14}>✅</Text>
                        <Text fontSize={14} color="#2d3436" fontWeight="500">Track your assets</Text>
                      </XStack>
                      <XStack backgroundColor="#f8f9fa" padding={12} borderRadius={8} gap={10} alignItems="center">
                        <Text fontSize={14}>✅</Text>
                        <Text fontSize={14} color="#2d3436" fontWeight="500">Monitor liabilities</Text>
                      </XStack>
                      <XStack backgroundColor="#f8f9fa" padding={12} borderRadius={8} gap={10} alignItems="center">
                        <Text fontSize={14}>✅</Text>
                        <Text fontSize={14} color="#2d3436" fontWeight="500">Calculate net worth</Text>
                      </XStack>
                    </YStack>
                  </YStack>
                </Card>
              </YStack>
            </Animated.View>
          </YStack>
        </ScrollView>

        {/* Footer - Fixed at bottom with safe area */}
        <YStack
          paddingHorizontal={24}
          paddingTop={16}
          paddingBottom={Math.max(insets.bottom, 20) + 16}
          backgroundColor="#faf8f5"
        >
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
      </YStack>
    </SafeAreaView>
  );
}

