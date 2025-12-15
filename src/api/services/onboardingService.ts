/**
 * Onboarding API Service
 * 
 * Handles onboarding flow via the backend API.
 */

import { ApiClient } from '../client';
import {
  OnboardingState,
  DataEntryTask,
  HouseholdType,
  AssetCategory,
  LiabilityCategory,
} from '../../shared/types';

interface OnboardingStateResponse {
  id: string;
  current_step_id: string;
  household_type: string | null;
  answers: Record<string, string | string[]>;
  tasks: Array<{
    id: string;
    type: string;
    category: string;
    default_name: string;
    is_completed: boolean;
    entity_id: string | null;
  }>;
  completed_task_ids: string[];
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface AnswerResponse {
  next_question_id: string | null;
  tasks_generated: Array<{
    id: string;
    type: string;
    category: string;
    default_name: string;
    is_completed: boolean;
    entity_id: string | null;
  }>;
}

interface OnboardingProgress {
  current_step: number;
  total_steps: number;
  percentage: number;
}

/**
 * Convert API response to OnboardingState type.
 */
function toOnboardingState(response: OnboardingStateResponse): OnboardingState {
  return {
    id: response.id,
    currentStepId: response.current_step_id,
    householdType: response.household_type as HouseholdType | null,
    answers: response.answers,
    tasks: response.tasks.map((task) => ({
      id: task.id,
      type: task.type as 'asset' | 'liability',
      category: task.category as AssetCategory | LiabilityCategory,
      defaultName: task.default_name,
      isCompleted: task.is_completed,
      entityId: task.entity_id ?? undefined,
    })),
    completedTaskIds: response.completed_task_ids,
    isComplete: response.is_complete,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

class OnboardingApiServiceClass {
  /**
   * Initialize or resume onboarding.
   */
  async initOrResume(): Promise<OnboardingState> {
    const response = await ApiClient.get<OnboardingStateResponse>('/onboarding');
    return toOnboardingState(response);
  }

  /**
   * Get current onboarding state.
   */
  async getState(): Promise<OnboardingState | null> {
    try {
      const response = await ApiClient.get<OnboardingStateResponse>('/onboarding');
      return toOnboardingState(response);
    } catch {
      return null;
    }
  }

  /**
   * Check if onboarding is complete.
   */
  async isComplete(): Promise<boolean> {
    const response = await ApiClient.get<{ is_complete: boolean }>('/onboarding/status');
    return response.is_complete;
  }

  /**
   * Answer a question.
   */
  async answerQuestion(
    questionId: string,
    answer: string | string[]
  ): Promise<{ nextQuestionId: string | null; tasksGenerated: DataEntryTask[] }> {
    const response = await ApiClient.post<AnswerResponse>('/onboarding/answer', {
      question_id: questionId,
      answer,
    });

    return {
      nextQuestionId: response.next_question_id,
      tasksGenerated: response.tasks_generated.map((task) => ({
        id: task.id,
        type: task.type as 'asset' | 'liability',
        category: task.category as AssetCategory | LiabilityCategory,
        defaultName: task.default_name,
        isCompleted: task.is_completed,
        entityId: task.entity_id ?? undefined,
      })),
    };
  }

  /**
   * Set household type.
   */
  async setHouseholdType(type: HouseholdType): Promise<void> {
    await ApiClient.post('/onboarding/household', {
      household_type: type,
    });
  }

  /**
   * Complete a data entry task.
   */
  async completeTask(
    taskId: string,
    data: { name: string; value: number; interestRate?: number }
  ): Promise<void> {
    await ApiClient.post('/onboarding/task/complete', {
      task_id: taskId,
      name: data.name,
      value: data.value,
      interest_rate: data.interestRate,
    });
  }

  /**
   * Skip a task.
   */
  async skipTask(taskId: string): Promise<void> {
    await ApiClient.post('/onboarding/task/skip', {
      task_id: taskId,
    });
  }

  /**
   * Get all tasks.
   */
  async getTasks(): Promise<DataEntryTask[]> {
    const state = await this.getState();
    return state?.tasks ?? [];
  }

  /**
   * Get progress percentage.
   */
  async getProgress(): Promise<number> {
    const response = await ApiClient.get<OnboardingProgress>('/onboarding/progress');
    return response.percentage;
  }

  /**
   * Mark onboarding as complete.
   */
  async complete(): Promise<void> {
    await ApiClient.post('/onboarding/complete');
  }

  /**
   * Reset onboarding (start over).
   */
  async reset(): Promise<void> {
    await ApiClient.delete('/onboarding/reset');
  }

  /**
   * Navigate to a specific step.
   */
  async goToStep(stepId: string): Promise<void> {
    await ApiClient.post(`/onboarding/go-to-step?step_id=${stepId}`);
  }
}

// Export singleton instance
export const OnboardingApiService = new OnboardingApiServiceClass();

