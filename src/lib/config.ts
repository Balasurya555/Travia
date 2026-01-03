/**
 * Environment configuration with validation
 * Centralizes all environment variable access
 */

const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
} as const;

const optionalEnvVars = {
  VITE_PEXELS_API_KEY: import.meta.env.VITE_PEXELS_API_KEY,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
} as const;

// Validate required environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const config = {
  supabase: {
    url: requiredEnvVars.VITE_SUPABASE_URL!,
    anonKey: requiredEnvVars.VITE_SUPABASE_PUBLISHABLE_KEY!,
  },
  pexels: {
    apiKey: optionalEnvVars.VITE_PEXELS_API_KEY,
  },
  app: {
    env: optionalEnvVars.VITE_APP_ENV as 'development' | 'production' | 'staging',
    isDevelopment: optionalEnvVars.VITE_APP_ENV === 'development',
    isProduction: optionalEnvVars.VITE_APP_ENV === 'production',
  },
} as const;

