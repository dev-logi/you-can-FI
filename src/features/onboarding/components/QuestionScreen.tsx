/**
 * Reusable Question Screen Component
 * 
 * Handles yes/no and multi-choice questions with consistent UI.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Platform, KeyboardAvoidingView, ScrollView, Pressable } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, ProgressBar, OptionButton } from '../../../shared/components';
import { useOnboardingStore } from '../store';
import { Question } from '../../../shared/types';
import { getPreviousQuestionId } from '../engine';

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

  // Check if we can go back (not on welcome screen)
  const previousQuestionId = getPreviousQuestionId(questionId);
  const canGoBack = previousQuestionId !== null;

  const handleBack = () => {
    router.back();
  };

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

    // Check if itemization is needed
    const needsItemization = checkItemizationNeeded(answer);

    if (needsItemization) {
      // Navigate to count input screen
      const itemizationLabel = getItemizationLabel(answer);
      const countRoute = `/(onboarding)/count-input?questionId=${encodeURIComponent(questionId)}&answer=${encodeURIComponent(JSON.stringify(answer))}&nextRoute=${encodeURIComponent(nextRoute)}&itemizationLabel=${encodeURIComponent(itemizationLabel)}`;
      router.push(countRoute as any);
      return;
    }

    // No itemization needed, proceed normally
    await answerQuestion(questionId, answer);
    router.push(nextRoute as any);
  };

  const checkItemizationNeeded = (answer: string | string[]): boolean => {
    if (isMultiChoice && Array.isArray(answer)) {
      // For multi-select, check if any selected option supports itemization
      return answer.some((value) => {
        const option = question.options?.find((opt) => opt.value === value);
        return option?.supportsItemization === true && value !== 'none';
      });
    } else if (!isMultiChoice && typeof answer === 'string') {
      // For yes/no, check if the selected option supports itemization
      const option = question.options?.find((opt) => opt.value === answer);
      return option?.supportsItemization === true && answer !== 'no';
    }
    return false;
  };

  const getItemizationLabel = (answer: string | string[]): string => {
    if (isMultiChoice && Array.isArray(answer)) {
      // For multi-select, we'll need to show counts for each option
      // This will be handled in CountInputScreen
      return 'How many accounts do you have?';
    } else if (!isMultiChoice && typeof answer === 'string') {
      const option = question.options?.find((opt) => opt.value === answer);
      return option?.itemizationLabel || 'How many do you have?';
    }
    return 'How many do you have?';
  };

  const canContinue = isMultiChoice
    ? selectedMulti.length > 0
    : selectedSingle !== null;

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
            {/* Back Button */}
            {canGoBack && (
              <Animated.View entering={FadeInDown.delay(50).springify()}>
                <Pressable onPress={handleBack} style={{ marginBottom: 16 }}>
                  <XStack alignItems="center" gap={8}>
                    <Text fontSize={18}>←</Text>
                    <Text fontSize={16} color="#636e72">
                      Back
                    </Text>
                  </XStack>
                </Pressable>
              </Animated.View>
            )}

            {/* Progress */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <ProgressBar progress={progress} />
            </Animated.View>

            {/* Question */}
            <YStack flex={1} justifyContent="center" gap={32} minHeight={400}>
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

            {/* Footer - Always visible at bottom */}
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

