/**
 * Student Loans Question
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function StudentLoansScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.STUDENT_LOANS}
      question={QUESTIONS[QUESTION_IDS.STUDENT_LOANS]}
      nextRoute="/(onboarding)/liabilities/other"
    />
  );
}

