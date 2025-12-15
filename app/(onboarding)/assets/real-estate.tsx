/**
 * Real Estate Question (Multi-select)
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function RealEstateScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.REAL_ESTATE}
      question={QUESTIONS[QUESTION_IDS.REAL_ESTATE]}
      nextRoute="/(onboarding)/assets/vehicles"
    />
  );
}

