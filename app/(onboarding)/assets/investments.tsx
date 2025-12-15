/**
 * Non-Retirement Investments Question
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function InvestmentsScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.INVESTMENTS}
      question={QUESTIONS[QUESTION_IDS.INVESTMENTS]}
      nextRoute="/(onboarding)/assets/real-estate"
    />
  );
}

