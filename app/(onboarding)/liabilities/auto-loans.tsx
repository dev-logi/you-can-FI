/**
 * Auto Loans Question
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function AutoLoansScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.AUTO_LOANS}
      question={QUESTIONS[QUESTION_IDS.AUTO_LOANS]}
      nextRoute="/(onboarding)/liabilities/student-loans"
    />
  );
}

