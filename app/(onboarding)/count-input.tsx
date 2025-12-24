/**
 * Count Input Route
 * 
 * Handles count input for itemization flow.
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CountInputScreen } from './components/CountInputScreen';
import { QUESTIONS } from '../../src/features/onboarding/engine/questions';

export default function CountInputRoute() {
  const params = useLocalSearchParams<{
    questionId: string;
    answer: string;
    nextRoute: string;
    itemizationLabel?: string;
  }>();

  // Parse answer (could be string or JSON array)
  let answer: string | string[];
  try {
    answer = JSON.parse(params.answer);
  } catch {
    answer = params.answer;
  }

  // Get itemization label from question config if not provided
  let itemizationLabel = params.itemizationLabel;
  if (!itemizationLabel && params.questionId) {
    const question = QUESTIONS[params.questionId];
    if (question) {
      if (Array.isArray(answer)) {
        // Multi-select: use generic label
        itemizationLabel = 'How many accounts do you have?';
      } else {
        // Yes/No: get from option
        const option = question.options?.find((opt) => opt.value === answer);
        itemizationLabel = option?.itemizationLabel || 'How many do you have?';
      }
    }
  }

  return (
    <CountInputScreen
      questionId={params.questionId}
      answer={answer}
      itemizationLabel={itemizationLabel || 'How many do you have?'}
      nextRoute={params.nextRoute}
    />
  );
}

