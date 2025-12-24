/**
 * Onboarding Questions Configuration
 * 
 * This file defines all questions in the TurboTax-style onboarding flow.
 * The flow is data-driven - add/modify questions here without changing code.
 * 
 * QUESTION TYPES:
 * - welcome: Intro screen with continue button
 * - single_choice: Pick one option
 * - multi_choice: Pick multiple options
 * - yes_no: Simple yes/no question
 * 
 * BRANCHING:
 * - Each question can specify next question based on answer
 * - Default flow follows QUESTION_ORDER array
 */

import { Question, QuestionOption } from '../../../shared/types';

// =============================================================================
// Question IDs (constants for type safety)
// =============================================================================

export const QUESTION_IDS = {
  WELCOME: 'welcome',
  HOUSEHOLD: 'household',
  CASH_ACCOUNTS: 'cash_accounts',
  SAVINGS: 'savings',
  RETIREMENT: 'retirement',
  INVESTMENTS: 'investments',
  REAL_ESTATE: 'real_estate',
  VEHICLES: 'vehicles',
  OTHER_ASSETS: 'other_assets',
  MORTGAGES: 'mortgages',
  CREDIT_CARDS: 'credit_cards',
  AUTO_LOANS: 'auto_loans',
  STUDENT_LOANS: 'student_loans',
  OTHER_DEBTS: 'other_debts',
  TASKS: 'tasks',
  REVIEW: 'review',
} as const;

// =============================================================================
// Question Order (default flow)
// =============================================================================

export const QUESTION_ORDER: string[] = [
  QUESTION_IDS.WELCOME,
  QUESTION_IDS.HOUSEHOLD,
  QUESTION_IDS.CASH_ACCOUNTS,
  QUESTION_IDS.SAVINGS,
  QUESTION_IDS.RETIREMENT,
  QUESTION_IDS.INVESTMENTS,
  QUESTION_IDS.REAL_ESTATE,
  QUESTION_IDS.VEHICLES,
  QUESTION_IDS.OTHER_ASSETS,
  QUESTION_IDS.MORTGAGES,
  QUESTION_IDS.CREDIT_CARDS,
  QUESTION_IDS.AUTO_LOANS,
  QUESTION_IDS.STUDENT_LOANS,
  QUESTION_IDS.OTHER_DEBTS,
  QUESTION_IDS.TASKS,
  QUESTION_IDS.REVIEW,
];

// =============================================================================
// Question Definitions
// =============================================================================

export const QUESTIONS: Record<string, Question> = {
  // Welcome Screen
  [QUESTION_IDS.WELCOME]: {
    id: QUESTION_IDS.WELCOME,
    type: 'welcome',
    title: "Let's get a clear picture of your finances",
    subtitle: "We'll walk through your assets and liabilities to calculate your net worth. This takes about 5 minutes.",
  },

  // Q1: Household Context
  [QUESTION_IDS.HOUSEHOLD]: {
    id: QUESTION_IDS.HOUSEHOLD,
    type: 'single_choice',
    title: 'Who is this financial picture for?',
    subtitle: 'This helps us personalize your experience',
    options: [
      { id: 'individual', label: 'Just me', value: 'individual' },
      { id: 'couple', label: 'Me and my partner', value: 'couple' },
      { id: 'family', label: 'My family', value: 'family' },
    ],
  },

  // Q2: Cash & Bank Accounts
  [QUESTION_IDS.CASH_ACCOUNTS]: {
    id: QUESTION_IDS.CASH_ACCOUNTS,
    type: 'yes_no',
    title: 'Do you have cash or bank accounts?',
    subtitle: 'Checking accounts, money market accounts, or cash on hand',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many checking or cash accounts do you have?',
        taskConfig: {
          type: 'asset',
          category: 'cash',
          defaultName: 'Cash & Checking',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Q3: Savings & Emergency Funds
  [QUESTION_IDS.SAVINGS]: {
    id: QUESTION_IDS.SAVINGS,
    type: 'yes_no',
    title: 'Do you have savings or emergency funds?',
    subtitle: 'Savings accounts, CDs, high-yield savings',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many savings accounts do you have?',
        taskConfig: {
          type: 'asset',
          category: 'savings',
          defaultName: 'Savings Account',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Q4: Retirement Accounts (multi-select)
  [QUESTION_IDS.RETIREMENT]: {
    id: QUESTION_IDS.RETIREMENT,
    type: 'multi_choice',
    title: 'What retirement accounts do you have?',
    subtitle: 'Select all that apply',
    supportsItemization: true,
    options: [
      {
        id: '401k',
        label: '401(k) / 403(b)',
        value: '401k',
        createsTask: true,
        supportsItemization: true,
        taskConfig: {
          type: 'asset',
          category: 'retirement_401k',
          defaultName: '401(k)',
        },
      },
      {
        id: 'ira',
        label: 'Traditional IRA',
        value: 'ira',
        createsTask: true,
        supportsItemization: true,
        taskConfig: {
          type: 'asset',
          category: 'retirement_ira',
          defaultName: 'Traditional IRA',
        },
      },
      {
        id: 'roth',
        label: 'Roth IRA',
        value: 'roth',
        createsTask: true,
        supportsItemization: true,
        taskConfig: {
          type: 'asset',
          category: 'retirement_roth',
          defaultName: 'Roth IRA',
        },
      },
      {
        id: 'hsa',
        label: 'HSA',
        value: 'hsa',
        createsTask: true,
        supportsItemization: true,
        taskConfig: {
          type: 'asset',
          category: 'retirement_hsa',
          defaultName: 'HSA',
        },
      },
      {
        id: 'pension',
        label: 'Pension',
        value: 'pension',
        createsTask: true,
        supportsItemization: true,
        taskConfig: {
          type: 'asset',
          category: 'retirement_pension',
          defaultName: 'Pension',
        },
      },
      {
        id: 'other_retirement',
        label: 'Other retirement account',
        value: 'other_retirement',
        createsTask: true,
        supportsItemization: true,
        taskConfig: {
          type: 'asset',
          category: 'retirement_other',
          defaultName: 'Other Retirement',
        },
      },
      { id: 'none', label: 'None of these', value: 'none' },
    ],
  },

  // Q5: Non-Retirement Investments
  [QUESTION_IDS.INVESTMENTS]: {
    id: QUESTION_IDS.INVESTMENTS,
    type: 'yes_no',
    title: 'Do you have investments outside retirement?',
    subtitle: 'Brokerage accounts, stocks, bonds, mutual funds, crypto',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many brokerage or investment accounts do you have?',
        taskConfig: {
          type: 'asset',
          category: 'brokerage',
          defaultName: 'Brokerage Account',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Q6: Real Estate (multi-select)
  [QUESTION_IDS.REAL_ESTATE]: {
    id: QUESTION_IDS.REAL_ESTATE,
    type: 'multi_choice',
    title: 'Do you own any real estate?',
    subtitle: 'Select all that apply',
    options: [
      {
        id: 'primary',
        label: 'Primary residence',
        value: 'primary',
        createsTask: true,
        taskConfig: {
          type: 'asset',
          category: 'real_estate_primary',
          defaultName: 'Primary Residence',
        },
      },
      {
        id: 'rental',
        label: 'Rental property',
        value: 'rental',
        createsTask: true,
        taskConfig: {
          type: 'asset',
          category: 'real_estate_rental',
          defaultName: 'Rental Property',
        },
      },
      {
        id: 'land',
        label: 'Land',
        value: 'land',
        createsTask: true,
        taskConfig: {
          type: 'asset',
          category: 'real_estate_land',
          defaultName: 'Land',
        },
      },
      { id: 'none', label: "I don't own real estate", value: 'none' },
    ],
  },

  // Q7: Vehicles
  [QUESTION_IDS.VEHICLES]: {
    id: QUESTION_IDS.VEHICLES,
    type: 'yes_no',
    title: 'Do you own any vehicles?',
    subtitle: 'Cars, motorcycles, boats, RVs (with significant value)',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many vehicles do you own?',
        taskConfig: {
          type: 'asset',
          category: 'vehicle',
          defaultName: 'Vehicle',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Q8: Other Assets (multi-select)
  [QUESTION_IDS.OTHER_ASSETS]: {
    id: QUESTION_IDS.OTHER_ASSETS,
    type: 'multi_choice',
    title: 'Any other valuable assets?',
    subtitle: 'Select all that apply',
    options: [
      {
        id: 'business',
        label: 'Business ownership',
        value: 'business',
        createsTask: true,
        taskConfig: {
          type: 'asset',
          category: 'business',
          defaultName: 'Business',
        },
      },
      {
        id: 'valuables',
        label: 'Valuables (jewelry, art, collectibles)',
        value: 'valuables',
        createsTask: true,
        taskConfig: {
          type: 'asset',
          category: 'valuables',
          defaultName: 'Valuables',
        },
      },
      {
        id: 'other',
        label: 'Other assets',
        value: 'other',
        createsTask: true,
        taskConfig: {
          type: 'asset',
          category: 'other',
          defaultName: 'Other Asset',
        },
      },
      { id: 'none', label: 'None of these', value: 'none' },
    ],
  },

  // Q9: Mortgages
  [QUESTION_IDS.MORTGAGES]: {
    id: QUESTION_IDS.MORTGAGES,
    type: 'yes_no',
    title: 'Do you have any mortgages?',
    subtitle: 'Home loans on any property you own',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many mortgages do you have?',
        taskConfig: {
          type: 'liability',
          category: 'mortgage',
          defaultName: 'Mortgage',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Q10: Credit Cards
  [QUESTION_IDS.CREDIT_CARDS]: {
    id: QUESTION_IDS.CREDIT_CARDS,
    type: 'yes_no',
    title: 'Do you carry credit card balances?',
    subtitle: 'Unpaid balances that accrue interest',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many credit cards with balances do you have?',
        taskConfig: {
          type: 'liability',
          category: 'credit_card',
          defaultName: 'Credit Card',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Q11: Auto Loans
  [QUESTION_IDS.AUTO_LOANS]: {
    id: QUESTION_IDS.AUTO_LOANS,
    type: 'yes_no',
    title: 'Do you have any auto loans?',
    subtitle: 'Car loans or leases',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many auto loans do you have?',
        taskConfig: {
          type: 'liability',
          category: 'auto_loan',
          defaultName: 'Auto Loan',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Q12: Student Loans
  [QUESTION_IDS.STUDENT_LOANS]: {
    id: QUESTION_IDS.STUDENT_LOANS,
    type: 'yes_no',
    title: 'Do you have student loans?',
    subtitle: 'Federal or private student loans',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many student loans do you have?',
        taskConfig: {
          type: 'liability',
          category: 'student_loan',
          defaultName: 'Student Loan',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Q13: Other Debts
  [QUESTION_IDS.OTHER_DEBTS]: {
    id: QUESTION_IDS.OTHER_DEBTS,
    type: 'yes_no',
    title: 'Any other debts or loans?',
    subtitle: 'Personal loans, medical debt, etc.',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        value: 'yes',
        createsTask: true,
        supportsItemization: true,
        itemizationLabel: 'How many other debts do you have?',
        taskConfig: {
          type: 'liability',
          category: 'other',
          defaultName: 'Other Debt',
        },
      },
      { id: 'no', label: 'No', value: 'no' },
    ],
  },

  // Tasks Screen (data entry)
  [QUESTION_IDS.TASKS]: {
    id: QUESTION_IDS.TASKS,
    type: 'welcome', // Special handling in UI
    title: 'Enter your values',
    subtitle: "Now let's add the numbers. You can skip items and add them later.",
  },

  // Review Screen
  [QUESTION_IDS.REVIEW]: {
    id: QUESTION_IDS.REVIEW,
    type: 'welcome', // Special handling in UI
    title: 'Your Net Worth Summary',
    subtitle: "Here's your financial snapshot. You can always update these values later.",
  },
};

// =============================================================================
// Navigation Helpers
// =============================================================================

/**
 * Get the next question ID based on current question and answer.
 * Returns null if this is the last question.
 */
export function getNextQuestionId(
  currentQuestionId: string,
  _answer?: string | string[]
): string | null {
  const currentIndex = QUESTION_ORDER.indexOf(currentQuestionId);

  if (currentIndex === -1) {
    console.warn(`[getNextQuestionId] Unknown question: ${currentQuestionId}`);
    return null;
  }

  // Check for custom branching (future enhancement)
  // For now, we use linear flow

  const nextIndex = currentIndex + 1;
  if (nextIndex >= QUESTION_ORDER.length) {
    return null; // End of flow
  }

  return QUESTION_ORDER[nextIndex];
}

/**
 * Get the previous question ID.
 * Returns null if this is the first question.
 */
export function getPreviousQuestionId(currentQuestionId: string): string | null {
  const currentIndex = QUESTION_ORDER.indexOf(currentQuestionId);

  if (currentIndex <= 0) {
    return null;
  }

  return QUESTION_ORDER[currentIndex - 1];
}

/**
 * Check if this is the last question before tasks.
 */
export function isLastDiscoveryQuestion(questionId: string): boolean {
  return questionId === QUESTION_IDS.OTHER_DEBTS;
}

/**
 * Check if this is a discovery question (asset/liability questions).
 */
export function isDiscoveryQuestion(questionId: string): boolean {
  const discoveryQuestions: string[] = [
    QUESTION_IDS.CASH_ACCOUNTS,
    QUESTION_IDS.SAVINGS,
    QUESTION_IDS.RETIREMENT,
    QUESTION_IDS.INVESTMENTS,
    QUESTION_IDS.REAL_ESTATE,
    QUESTION_IDS.VEHICLES,
    QUESTION_IDS.OTHER_ASSETS,
    QUESTION_IDS.MORTGAGES,
    QUESTION_IDS.CREDIT_CARDS,
    QUESTION_IDS.AUTO_LOANS,
    QUESTION_IDS.STUDENT_LOANS,
    QUESTION_IDS.OTHER_DEBTS,
  ];

  return discoveryQuestions.includes(questionId);
}

/**
 * Get progress through the question flow (0-100).
 */
export function getQuestionProgress(questionId: string): number {
  const index = QUESTION_ORDER.indexOf(questionId);
  if (index === -1) return 0;

  return Math.round((index / (QUESTION_ORDER.length - 1)) * 100);
}

