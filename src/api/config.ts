/**
 * API Configuration
 * 
 * Configure the backend API URL here.
 * Change this when deploying to Railway.
 */

// For local development
const LOCAL_API_URL = 'http://localhost:8000/api/v1';

// For production (Railway) - update this after deploying
const PRODUCTION_API_URL = 'https://your-app.railway.app/api/v1';

// Toggle this based on environment
const IS_PRODUCTION = false;

export const API_BASE_URL = IS_PRODUCTION ? PRODUCTION_API_URL : LOCAL_API_URL;

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

