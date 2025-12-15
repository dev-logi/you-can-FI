/**
 * Onboarding Engine Export
 * 
 * This module contains the data-driven onboarding configuration.
 * The engine is separate from the UI, making it easy to:
 * - Add/modify questions without changing code
 * - Test the flow logic independently
 * - Reuse in different UI implementations
 */

export {
  QUESTIONS,
  QUESTION_ORDER,
  QUESTION_IDS,
  getNextQuestionId,
  getPreviousQuestionId,
  isLastDiscoveryQuestion,
  isDiscoveryQuestion,
  getQuestionProgress,
} from './questions';

