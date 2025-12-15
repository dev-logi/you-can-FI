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

// Automatically detect environment (true in production builds)
const IS_PRODUCTION = !__DEV__;

export const API_BASE_URL = IS_PRODUCTION ? PRODUCTION_API_URL : LOCAL_API_URL;

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

