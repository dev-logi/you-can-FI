/**
 * Reusable Question Screen Component
 * 
 * Handles yes/no and multi-choice questions with consistent UI.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, ProgressBar, OptionButton } from '../../../shared/components';
import { useOnboardingStore } from '../store';
import { Question } from '../../../shared/types';

interface QuestionScreenProps {
  questionId: string;
  question: Question;
  nextRoute: string;
}

export function QuestionScreen({ questionId, question, nextRoute }: QuestionScreenProps) {
  const router = useRouter();
  const { answerQuestion, progress, isLoading, state } = useOnboardingStore();
  
  // For multi-choice, use array; for single/yes-no, use string
  const isMultiChoice = question.type === 'multi_choice';
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);

  // Restore previous answer if navigating back
  useEffect(() => {
    if (state?.answers[questionId]) {
      const previousAnswer = state.answers[questionId];
      if (Array.isArray(previousAnswer)) {
        setSelectedMulti(previousAnswer);
      } else {
        setSelectedSingle(previousAnswer);
      }
    }
  }, [state, questionId]);

  const handleOptionPress = (value: string) => {
    if (isMultiChoice) {
      // For multi-choice, toggle selection
      // If "none" is selected, clear other selections
      if (value === 'none') {
        setSelectedMulti(['none']);
      } else {
        setSelectedMulti((prev) => {
          const filtered = prev.filter((v) => v !== 'none');
          if (filtered.includes(value)) {
            return filtered.filter((v) => v !== value);
          }
          return [...filtered, value];
        });
      }
    } else {
      setSelectedSingle(value);
    }
  };

  const handleContinue = async () => {
    const answer = isMultiChoice ? selectedMulti : selectedSingle;
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;

    await answerQuestion(questionId, answer);
    router.push(nextRoute as any);
  };

  const canContinue = isMultiChoice
    ? selectedMulti.length > 0
    : selectedSingle !== null;

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
              {question.options?.map((option) => {
                const isSelected = isMultiChoice
                  ? selectedMulti.includes(option.value)
                  : selectedSingle === option.value;

                return (
                  <OptionButton
                    key={option.id}
                    label={option.label}
                    selected={isSelected}
                    onPress={() => handleOptionPress(option.value)}
                    radio={!isMultiChoice}
                  />
                );
              })}
            </YStack>
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
    </SafeAreaView>
  );
}

