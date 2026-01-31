/**
 * Supabase Client Configuration
 * 
 * Creates and configures the Supabase client for authentication and database access.
 */

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration - must be set via environment variables
// See .env.example for required variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables. See .env.example for details.'
  );
}

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

