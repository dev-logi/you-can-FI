/**
 * Cash & Bank Accounts Question
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function CashScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.CASH_ACCOUNTS}
      question={QUESTIONS[QUESTION_IDS.CASH_ACCOUNTS]}
      nextRoute="/(onboarding)/assets/retirement"
    />
  );
}

