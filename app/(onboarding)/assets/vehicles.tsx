/**
 * Vehicles Question
 */

import React from 'react';
import { QuestionScreen } from '../../../src/features/onboarding/components';
import { QUESTION_IDS, QUESTIONS } from '../../../src/features/onboarding/engine';

export default function VehiclesScreen() {
  return (
    <QuestionScreen
      questionId={QUESTION_IDS.VEHICLES}
      question={QUESTIONS[QUESTION_IDS.VEHICLES]}
      nextRoute="/(onboarding)/assets/other"
    />
  );
}

