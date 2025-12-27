/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state.
 * Handles login, signup, logout, and session management.
 */

import { create } from 'zustand';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface AuthStore {
  // State
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Initialize auth state by checking for existing session
   */
  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });

    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthStore] Error getting session:', error);
        set({ error: error.message, isLoading: false, isInitialized: true });
        return;
      }

      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isInitialized: true,
      });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (error) {
      console.error('[AuthStore] Initialize error:', error);
      set({
        error: 'Failed to initialize authentication',
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Sign up a new user
   */
  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'youcanfi://email-confirmed', // Deep link for email confirmation
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      // Check if email confirmation is required
      // If session is null but user exists, email confirmation is required
      const needsEmailConfirmation = !data.session && data.user && !data.user.email_confirmed_at;

      set({
        session: data.session,
        user: data.user,
        isLoading: false,
      });

      return { 
        error: null,
        needsEmailConfirmation,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      set({ error: errorMessage, isLoading: false });
      return { error: { message: errorMessage } as AuthError };
    }
  },

  /**
   * Resend email confirmation
   */
  resendConfirmationEmail: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: 'youcanfi://email-confirmed',
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      set({ isLoading: false });
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend confirmation email';
      set({ error: errorMessage, isLoading: false });
      return { error: { message: errorMessage } as AuthError };
    }
  },

  /**
   * Sign in an existing user
   */
  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      set({
        session: data.session,
        user: data.user,
        isLoading: false,
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      set({ error: errorMessage, isLoading: false });
      return { error: { message: errorMessage } as AuthError };
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      set({
        session: null,
        user: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));

