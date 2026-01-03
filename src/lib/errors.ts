/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Handle Supabase errors and convert to AppError
 */
export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Supabase error structure
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; code?: string; statusCode?: number };
    
    // Map common Supabase error codes
    if (supabaseError.code === 'PGRST116') {
      return new NotFoundError();
    }
    
    if (supabaseError.code === '42501' || supabaseError.message.includes('permission')) {
      return new AuthorizationError(supabaseError.message);
    }

    if (supabaseError.message.includes('JWT') || supabaseError.message.includes('auth')) {
      return new AuthenticationError(supabaseError.message);
    }

    return new AppError(
      supabaseError.message,
      supabaseError.code || 'UNKNOWN_ERROR',
      supabaseError.statusCode || 500,
      error
    );
  }

  // Generic error
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, error);
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, error);
}

/**
 * Log error for debugging (in production, send to monitoring service)
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  // Check environment directly to avoid circular dependency
  const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || !import.meta.env.VITE_APP_ENV;
  
  if (isDevelopment) {
    console.error('Error:', error, context);
  } else {
    // In production, send to error tracking service (e.g., Sentry, LogRocket)
    // Example: Sentry.captureException(error, { extra: context });
  }
}

