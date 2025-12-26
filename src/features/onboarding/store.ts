/**
 * Onboarding Zustand Store
 * 
 * Manages UI state for the onboarding flow.
 * Syncs with OnboardingApiService via the Python backend.
 * 
 * ARCHITECTURE: UI components read from this store.
 * The store calls the API service which talks to the backend.
 */

import { create } from 'zustand';
import {
  OnboardingState,
  DataEntryTask,
  HouseholdType,
  Question,
} from '../../shared/types';
import { OnboardingApiService } from '../../api/services/onboardingService';
import { QUESTIONS, getQuestionProgress } from './engine/questions';

interface OnboardingStore {
  // State
  isLoading: boolean;
  isInitialized: boolean;
  state: OnboardingState | null;
  currentQuestion: Question | null;
  progress: number;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  answerQuestion: (
    questionId: string,
    answer: string | string[],
    count?: number,
    counts?: Record<string, number>
  ) => Promise<void>;
  setHouseholdType: (type: HouseholdType) => Promise<void>;
  completeTask: (taskId: string, data: { name: string; value: number; interestRate?: number }) => Promise<void>;
  skipTask: (taskId: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  reset: () => Promise<void>;
  goToStep: (stepId: string) => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Initial state
  isLoading: false,
  isInitialized: false,
  state: null,
  currentQuestion: null,
  progress: 0,
  error: null,

  // Initialize or resume onboarding
  init: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });

    try {
      const state = await OnboardingApiService.initOrResume();
      const currentQuestion = QUESTIONS[state.currentStepId] ?? null;
      const progress = getQuestionProgress(state.currentStepId);

      set({
        isLoading: false,
        isInitialized: true,
        state,
        currentQuestion,
        progress,
      });
    } catch (error) {
      console.error('[OnboardingStore] Init error:', error);
      set({
        isLoading: false,
        error: 'Failed to initialize onboarding',
      });
    }
  },

  // Answer a question and move to next
  answerQuestion: async (
    questionId: string,
    answer: string | string[],
    count?: number,
    counts?: Record<string, number>
  ) => {
    set({ isLoading: true, error: null });

    try {
      const { nextQuestionId, tasksGenerated } = await OnboardingApiService.answerQuestion(
        questionId,
        answer,
        count,
        counts
      );

      console.log('[OnboardingStore] Answer question result:', {
        questionId,
        answer,
        count,
        counts,
        nextQuestionId,
        tasksGenerated: tasksGenerated.length,
        tasksGeneratedDetails: tasksGenerated,
      });

      // Update state optimistically without fetching full state
      const currentState = get().state;
      const currentQuestion = nextQuestionId ? QUESTIONS[nextQuestionId] : null;
      const progress = nextQuestionId ? getQuestionProgress(nextQuestionId) : 100;

      // Merge new tasks into existing tasks
      const existingTasks = currentState?.tasks ?? [];
      const newTasks = [...existingTasks, ...tasksGenerated];
      
      console.log('[OnboardingStore] Task merge:', {
        existingTasksCount: existingTasks.length,
        newTasksCount: tasksGenerated.length,
        totalTasksCount: newTasks.length,
      });
      
      // Update state optimistically
      const updatedState: OnboardingState | null = currentState ? {
        ...currentState,
        currentStepId: nextQuestionId ?? currentState.currentStepId,
        answers: {
          ...currentState.answers,
          [questionId]: answer,
        },
        tasks: newTasks,
      } : null;

      set({
        isLoading: false,
        state: updatedState,
        currentQuestion,
        progress,
      });

      // Fetch full state in background to ensure consistency (non-blocking)
      OnboardingApiService.getState().then((fullState) => {
        if (fullState) {
          set({ state: fullState });
        }
      }).catch((err) => {
        console.warn('[OnboardingStore] Background state refresh failed:', err);
      });
    } catch (error) {
      console.error('[OnboardingStore] Answer error:', error);
      set({
        isLoading: false,
        error: 'Failed to save answer',
      });
    }
  },

  // Set household type
  setHouseholdType: async (type: HouseholdType) => {
    try {
      await OnboardingApiService.setHouseholdType(type);
      const state = await OnboardingApiService.getState();
      set({ state });
    } catch (error) {
      console.error('[OnboardingStore] Set household error:', error);
      set({ error: 'Failed to save household type' });
    }
  },

  // Complete a data entry task
  completeTask: async (taskId: string, data) => {
    set({ isLoading: true, error: null });

    try {
      await OnboardingApiService.completeTask(taskId, data);
      const state = await OnboardingApiService.getState();
      set({ isLoading: false, state });
    } catch (error) {
      console.error('[OnboardingStore] Complete task error:', error);
      set({
        isLoading: false,
        error: 'Failed to save entry',
      });
    }
  },

  // Skip a task
  skipTask: async (taskId: string) => {
    try {
      await OnboardingApiService.skipTask(taskId);
      const state = await OnboardingApiService.getState();
      set({ state });
    } catch (error) {
      console.error('[OnboardingStore] Skip task error:', error);
      set({ error: 'Failed to skip task' });
    }
  },

  // Complete onboarding
  completeOnboarding: async () => {
    set({ isLoading: true, error: null });

    try {
      await OnboardingApiService.complete();
      const state = await OnboardingApiService.getState();
      set({ isLoading: false, state });
    } catch (error) {
      console.error('[OnboardingStore] Complete error:', error);
      set({
        isLoading: false,
        error: 'Failed to complete onboarding',
      });
    }
  },

  // Reset onboarding
  reset: async () => {
    set({ isLoading: true, error: null });

    try {
      await OnboardingApiService.reset();
      set({
        isLoading: false,
        isInitialized: false,
        state: null,
        currentQuestion: null,
        progress: 0,
      });
    } catch (error) {
      console.error('[OnboardingStore] Reset error:', error);
      set({
        isLoading: false,
        error: 'Failed to reset onboarding',
      });
    }
  },

  // Navigate to a specific step
  goToStep: async (stepId: string) => {
    try {
      const state = await OnboardingApiService.getState();
      if (!state) return;

      // Update current step via API
      await OnboardingApiService.goToStep(stepId);

      const updatedState = await OnboardingApiService.getState();
      const currentQuestion = QUESTIONS[stepId] ?? null;
      const progress = getQuestionProgress(stepId);

      set({
        state: updatedState,
        currentQuestion,
        progress,
      });
    } catch (error) {
      console.error('[OnboardingStore] Go to step error:', error);
      set({ error: 'Failed to navigate' });
    }
  },
}));

