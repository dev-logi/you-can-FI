/**
 * Count Input Screen Component
 * 
 * Displays a number input for itemization (e.g., "How many savings accounts?")
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, ProgressBar } from '../../../src/shared/components';
import { useOnboardingStore } from '../../../src/features/onboarding/store';

interface CountInputScreenProps {
  questionId: string;
  answer: string | string[];
  itemizationLabel: string;
  nextRoute: string;
  onComplete?: (count: number | Record<string, number>) => void;
}

export function CountInputScreen({
  questionId,
  answer,
  itemizationLabel,
  nextRoute,
  onComplete,
}: CountInputScreenProps) {
  const router = useRouter();
  const { answerQuestion, progress, isLoading } = useOnboardingStore();
  const [count, setCount] = useState(1);

  const isMultiSelect = Array.isArray(answer);
  const selectedOptions = isMultiSelect ? (answer as string[]) : [];

  // For multi-select, we need to collect counts for each option
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    if (isMultiSelect) {
      const initial: Record<string, number> = {};
      selectedOptions.forEach((option) => {
        initial[option] = 1;
      });
      return initial;
    }
    return {};
  });

  const handleDecrement = (option?: string) => {
    if (option) {
      setCounts((prev) => ({
        ...prev,
        [option]: Math.max(1, (prev[option] || 1) - 1),
      }));
    } else {
      setCount(Math.max(1, count - 1));
    }
  };

  const handleIncrement = (option?: string) => {
    if (option) {
      setCounts((prev) => ({
        ...prev,
        [option]: Math.min(50, (prev[option] || 1) + 1),
      }));
    } else {
      setCount(Math.min(50, count + 1));
    }
  };

  const handleContinue = async () => {
    if (isMultiSelect) {
      // For multi-select, send counts dict
      await answerQuestion(questionId, answer as string[], undefined, counts);
      if (onComplete) {
        onComplete(counts);
      }
    } else {
      // For yes/no, send single count
      await answerQuestion(questionId, answer as string, count);
      if (onComplete) {
        onComplete(count);
      }
    }
    router.push(nextRoute as any);
  };

  const canContinue = isMultiSelect
    ? Object.values(counts).every((c) => c >= 1)
    : count >= 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack flex={1} padding={24} paddingBottom={40}>
            {/* Progress */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <ProgressBar progress={progress} />
            </Animated.View>

            {/* Content */}
            <YStack flex={1} justifyContent="center" gap={32} minHeight={400}>
              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <YStack gap={8} alignItems="center">
                  <Text fontSize={48}>💰</Text>
                  <Text
                    fontSize={28}
                    fontWeight="700"
                    color="#2d3436"
                    fontFamily="$heading"
                    textAlign="center"
                  >
                    {itemizationLabel}
                  </Text>
                  <Text fontSize={16} color="#636e72" textAlign="center">
                    You'll be able to enter details for each account separately
                  </Text>
                </YStack>
              </Animated.View>

              {/* Count Input */}
              <Animated.View entering={FadeInDown.delay(300).springify()}>
                {isMultiSelect ? (
                  <YStack gap={20}>
                    {selectedOptions.map((option) => {
                      const optionLabel = option
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase());
                      const optionCount = counts[option] || 1;

                      return (
                        <YStack key={option} gap={8}>
                          <Text fontSize={16} fontWeight="600" color="#2d3436">
                            {optionLabel}
                          </Text>
                          <XStack
                            alignItems="center"
                            justifyContent="center"
                            gap={24}
                            paddingVertical={16}
                            backgroundColor="#ffffff"
                            borderRadius={16}
                            borderWidth={2}
                            borderColor="#e8e8e8"
                          >
                            <Button
                              variant="ghost"
                              onPress={() => handleDecrement(option)}
                              disabled={optionCount <= 1}
                              style={{ minWidth: 60 }}
                            >
                              −
                            </Button>
                            <Text
                              fontSize={32}
                              fontWeight="700"
                              color="#1e3a5f"
                              minWidth={60}
                              textAlign="center"
                            >
                              {optionCount}
                            </Text>
                            <Button
                              variant="ghost"
                              onPress={() => handleIncrement(option)}
                              disabled={optionCount >= 50}
                              style={{ minWidth: 60 }}
                            >
                              +
                            </Button>
                          </XStack>
                        </YStack>
                      );
                    })}
                  </YStack>
                ) : (
                  <XStack
                    alignItems="center"
                    justifyContent="center"
                    gap={24}
                    paddingVertical={24}
                    backgroundColor="#ffffff"
                    borderRadius={16}
                    borderWidth={2}
                    borderColor="#e8e8e8"
                  >
                    <Button
                      variant="ghost"
                      onPress={() => handleDecrement()}
                      disabled={count <= 1}
                      style={{ minWidth: 60 }}
                    >
                      −
                    </Button>
                    <Text
                      fontSize={48}
                      fontWeight="700"
                      color="#1e3a5f"
                      minWidth={80}
                      textAlign="center"
                    >
                      {count}
                    </Text>
                    <Button
                      variant="ghost"
                      onPress={() => handleIncrement()}
                      disabled={count >= 50}
                      style={{ minWidth: 60 }}
                    >
                      +
                    </Button>
                  </XStack>
                )}
              </Animated.View>
            </YStack>

            {/* Footer */}
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <Button
                variant="primary"
                fullWidth
                onPress={handleContinue}
                disabled={!canContinue}
                loading={isLoading}
              >
                Continue
              </Button>
            </Animated.View>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

