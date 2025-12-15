/**
 * Other Assets Question (Multi-select)
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function OtherAssetsScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.OTHER_ASSETS}
      question={QUESTIONS[QUESTION_IDS.OTHER_ASSETS]}
      nextRoute="/(onboarding)/liabilities/mortgages"
    />
  );
}

