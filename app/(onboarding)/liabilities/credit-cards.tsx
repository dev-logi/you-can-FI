/**
 * Credit Cards Question
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function CreditCardsScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.CREDIT_CARDS}
      question={QUESTIONS[QUESTION_IDS.CREDIT_CARDS]}
      nextRoute="/(onboarding)/liabilities/auto-loans"
    />
  );
}

