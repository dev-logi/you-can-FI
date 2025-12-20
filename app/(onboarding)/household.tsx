/**
 * Household Selection Screen
 * 
 * Q1: Who is this financial picture for?
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, ProgressBar, OptionButton } from '../../src/shared/components';
import { useOnboardingStore } from '../../src/features/onboarding/store';
import { QUESTION_IDS, QUESTIONS } from '../../src/features/onboarding/engine';
import { HouseholdType } from '../../src/shared/types';

export default function HouseholdScreen() {
  const router = useRouter();
  const { answerQuestion, progress, isLoading } = useOnboardingStore();
  const [selected, setSelected] = useState<HouseholdType | null>(null);

  const question = QUESTIONS[QUESTION_IDS.HOUSEHOLD];

  const handleContinue = async () => {
    if (!selected) return;

    // answerQuestion already saves the household type, no need for separate call
    await answerQuestion(QUESTION_IDS.HOUSEHOLD, selected);
    router.push('/(onboarding)/assets/cash');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1} padding={24}>
        {/* Progress */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ProgressBar progress={progress} />
        </Animated.View>

        {/* Question */}
        <YStack flex={1} justifyContent="center" gap={32}>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <YStack gap={8}>
              <Text
                fontSize={28}
                fontWeight="700"
                color="#2d3436"
                fontFamily="$heading"
              >
                {question.title}
              </Text>
              {question.subtitle && (
                <Text fontSize={16} color="#636e72">
                  {question.subtitle}
                </Text>
              )}
            </YStack>
          </Animated.View>

          {/* Options */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <YStack gap={12}>
              {question.options?.map((option) => (
                <OptionButton
                  key={option.id}
                  label={option.label}
                  selected={selected === option.value}
                  onPress={() => setSelected(option.value as HouseholdType)}
                  radio
                />
              ))}
            </YStack>
          </Animated.View>
        </YStack>

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Button
            variant="primary"
            fullWidth
            onPress={handleContinue}
            disabled={!selected}
            loading={isLoading}
          >
            Continue
          </Button>
        </Animated.View>
      </YStack>
    </SafeAreaView>
  );
}

