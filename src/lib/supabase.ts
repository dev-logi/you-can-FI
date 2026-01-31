/**
 * Supabase Client Configuration
 * 
 * Creates and configures the Supabase client for authentication and database access.
 */

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration
// These are public values (anon key is safe to expose in client code)
// Can be overridden via environment variables if needed
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cwsoawrcxogoxrgmtowx.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c29hd3JjeG9nb3hyZ210b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzcxMDMsImV4cCI6MjA4MTQxMzEwM30.Ei4_D44jywFpkneIKRHkSFMGL8MVodBYEof82xlZ-iU';

/**
 * Custom storage adapter for React Native using expo-secure-store
 * Falls back to localStorage for web platform
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      // Use localStorage for web, SecureStore for native
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[Supabase] Error getting item from secure store:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      // Use localStorage for web, SecureStore for native
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('[Supabase] Error setting item in secure store:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      // Use localStorage for web, SecureStore for native
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('[Supabase] Error removing item from secure store:', error);
    }
  },
};

/**
 * Create Supabase client with React Native storage adapter
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // React Native doesn't use URL-based auth
  },
});

