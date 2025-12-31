/**
 * Count Input Route
 * 
 * Wraps the CountInputScreen component to handle navigation parameters.
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CountInputScreen } from './components/CountInputScreen';

export default function CountInputRoute() {
  const params = useLocalSearchParams<{
    questionId: string;
    answer: string;
    nextRoute: string;
    itemizationLabel: string;
  }>();

  // Parse answer if it's a JSON string (for multi-select)
  let parsedAnswer: string | string[] = params.answer;
  try {
    if (params.answer && (params.answer.startsWith('[') || params.answer.includes('"'))) {
      parsedAnswer = JSON.parse(params.answer);
    }
  } catch (e) {
    // Keep as string if parse fails
    console.warn('[CountInputRoute] Failed to parse answer:', e);
  }

  return (
    <CountInputScreen
      questionId={params.questionId}
      answer={parsedAnswer}
      nextRoute={params.nextRoute}
      itemizationLabel={params.itemizationLabel}
    />
  );
}
