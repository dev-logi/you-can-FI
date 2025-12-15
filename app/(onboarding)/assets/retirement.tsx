/**
 * Retirement Accounts Question (Multi-select)
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function RetirementScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.RETIREMENT}
      question={QUESTIONS[QUESTION_IDS.RETIREMENT]}
      nextRoute="/(onboarding)/assets/investments"
    />
  );
}

