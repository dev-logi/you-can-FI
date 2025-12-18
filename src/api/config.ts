/**
 * API Configuration
 * 
 * Configure the backend API URL here.
 * Change this when deploying to Railway.
 */

// For local development
const LOCAL_API_URL = 'http://localhost:8000/api/v1';

// For production (Railway)
const PRODUCTION_API_URL = 'https://you-can-fi-production.up.railway.app/api/v1';

// Use Railway server for all environments (local backend not needed)
// Set to false if you want to use localhost:8000 for local development
const USE_PRODUCTION_API = true;

export const API_BASE_URL = USE_PRODUCTION_API ? PRODUCTION_API_URL : LOCAL_API_URL;

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 60000, // 60 seconds - increased for slower network connections
  headers: {
    'Content-Type': 'application/json',
  },
};

