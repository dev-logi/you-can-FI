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
      
      // Preserve existing state if refresh fails
      const currentState = get().state;
      try {
        const freshState = await OnboardingApiService.getState();
        if (freshState) {
          set({ state: freshState });
        } else if (currentState) {
          // Update household type optimistically
          set({
            state: {
              ...currentState,
              householdType: type,
            },
          });
        }
      } catch (refreshError) {
        console.error('[OnboardingStore] Failed to refresh state after setting household type:', refreshError);
        // Update household type optimistically if refresh fails
        if (currentState) {
          set({
            state: {
              ...currentState,
              householdType: type,
            },
          });
        }
      }
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
      
      // Optimistically update the task as completed
      const currentState = get().state;
      if (currentState) {
        const updatedTasks = currentState.tasks.map(task =>
          task.id === taskId
            ? { ...task, isCompleted: true, entityId: 'pending' } // Will be updated by refresh
            : task
        );
        
        set({
          isLoading: false,
          state: {
            ...currentState,
            tasks: updatedTasks,
          },
        });
      }
      
      // Try to refresh state in background, but don't lose state if it fails
      try {
        const freshState = await OnboardingApiService.getState();
        if (freshState) {
          set({ state: freshState });
        } else {
          console.warn('[OnboardingStore] getState returned null after completing task, keeping optimistic state');
        }
      } catch (refreshError) {
        console.error('[OnboardingStore] Failed to refresh state after completing task:', refreshError);
        // Keep the optimistic state we set above
      }
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
      
      // Optimistically update the task as completed
      const currentState = get().state;
      if (currentState) {
        const updatedTasks = currentState.tasks.map(task =>
          task.id === taskId
            ? { ...task, isCompleted: true }
            : task
        );
        
        set({
          state: {
            ...currentState,
            tasks: updatedTasks,
          },
        });
      }
      
      // Try to refresh state in background
      try {
        const freshState = await OnboardingApiService.getState();
        if (freshState) {
          set({ state: freshState });
        } else {
          console.warn('[OnboardingStore] getState returned null after skipping task, keeping optimistic state');
        }
      } catch (refreshError) {
        console.error('[OnboardingStore] Failed to refresh state after skipping task:', refreshError);
        // Keep the optimistic state we set above
      }
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
      
      // Preserve existing state if refresh fails
      const currentState = get().state;
      try {
        const freshState = await OnboardingApiService.getState();
        if (freshState) {
          set({ isLoading: false, state: freshState });
        } else if (currentState) {
          // Update optimistically
          set({
            isLoading: false,
            state: {
              ...currentState,
              isComplete: true,
            },
          });
        }
      } catch (refreshError) {
        console.error('[OnboardingStore] Failed to refresh state after completing onboarding:', refreshError);
        // Update optimistically if refresh fails
        if (currentState) {
          set({
            isLoading: false,
            state: {
              ...currentState,
              isComplete: true,
            },
          });
        }
      }
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
      const currentState = get().state;
      
      // Update current step via API
      await OnboardingApiService.goToStep(stepId);

      const currentQuestion = QUESTIONS[stepId] ?? null;
      const progress = getQuestionProgress(stepId);

      // Try to refresh state, but preserve if it fails
      try {
        const updatedState = await OnboardingApiService.getState();
        if (updatedState) {
          set({
            state: updatedState,
            currentQuestion,
            progress,
          });
        } else if (currentState) {
          // Update optimistically
          set({
            state: {
              ...currentState,
              currentStepId: stepId,
            },
            currentQuestion,
            progress,
          });
        }
      } catch (refreshError) {
        console.error('[OnboardingStore] Failed to refresh state after navigating:', refreshError);
        // Update optimistically if refresh fails
        if (currentState) {
          set({
            state: {
              ...currentState,
              currentStepId: stepId,
            },
            currentQuestion,
            progress,
          });
        }
      }
    } catch (error) {
      console.error('[OnboardingStore] Go to step error:', error);
      set({ error: 'Failed to navigate' });
    }
  },
}));

