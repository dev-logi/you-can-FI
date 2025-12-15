/**
 * Savings & Emergency Funds Question
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function SavingsScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.SAVINGS}
      question={QUESTIONS[QUESTION_IDS.SAVINGS]}
      nextRoute="/(onboarding)/assets/retirement"
    />
  );
}

