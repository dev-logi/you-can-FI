/**
 * Mortgages Question
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function MortgagesScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.MORTGAGES}
      question={QUESTIONS[QUESTION_IDS.MORTGAGES]}
      nextRoute="/(onboarding)/liabilities/credit-cards"
    />
  );
}

