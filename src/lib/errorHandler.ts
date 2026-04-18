/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  AUTHORIZATION = 'AUTHZ_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Create a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>
): AppError {
  return {
    type,
    message,
    statusCode,
    details,
    timestamp: new Date(),
  };
}

/**
 * Handle API errors with proper logging
 */
export function handleApiError(error: any): AppError {
  console.error('[API Error]', error);

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createError(
      ErrorType.NETWORK,
      'فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
      0,
      { originalError: error.message }
    );
  }

  // HTTP errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return createError(
          ErrorType.VALIDATION,
          'البيانات المرسلة غير صحيحة.',
          400,
          { details: error.message }
        );
      case 401:
        return createError(
          ErrorType.AUTHENTICATION,
          'يجب تسجيل الدخول أولاً.',
          401
        );
      case 403:
        return createError(
          ErrorType.AUTHORIZATION,
          'ليس لديك صلاحية للقيام بهذا الإجراء.',
          403
        );
      case 404:
        return createError(
          ErrorType.NOT_FOUND,
          'المورد المطلوب غير موجود.',
          404
        );
      case 409:
        return createError(
          ErrorType.CONFLICT,
          'تعارض في البيانات. قد يكون هذا العنصر موجوداً بالفعل.',
          409
        );
      case 429:
        return createError(
          ErrorType.RATE_LIMIT,
          'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.',
          429
        );
      case 500:
      case 502:
      case 503:
        return createError(
          ErrorType.SERVER,
          'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
          error.status
        );
    }
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    return createError(
      ErrorType.NETWORK,
      'انتهت مهلة الانتظار. يرجى المحاولة مرة أخرى.',
      0,
      { timeout: true }
    );
  }

  // Default error
  return createError(
    ErrorType.UNKNOWN,
    'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.',
    500,
    { originalError: error.message }
  );
}

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: any): AppError {
  console.error('[Supabase Error]', error);

  if (!error) {
    return createError(
      ErrorType.UNKNOWN,
      'حدث خطأ غير معروف.',
      500
    );
  }

  // Auth errors
  if (error.message?.includes('Invalid login credentials')) {
    return createError(
      ErrorType.AUTHENTICATION,
      'بيانات الدخول غير صحيحة.',
      401
    );
  }

  if (error.message?.includes('User already registered')) {
    return createError(
      ErrorType.CONFLICT,
      'هذا البريد الإلكتروني مسجل بالفعل.',
      409
    );
  }

  if (error.message?.includes('Email not confirmed')) {
    return createError(
      ErrorType.AUTHENTICATION,
      'يجب تأكيد بريدك الإلكتروني أولاً.',
      401
    );
  }

  // RLS errors
  if (error.message?.includes('new row violates row-level security policy')) {
    return createError(
      ErrorType.AUTHORIZATION,
      'ليس لديك صلاحية لإجراء هذا الإجراء.',
      403
    );
  }

  // Database errors
  if (error.message?.includes('duplicate key')) {
    return createError(
      ErrorType.CONFLICT,
      'هذا العنصر موجود بالفعل.',
      409
    );
  }

  if (error.message?.includes('foreign key violation')) {
    return createError(
      ErrorType.VALIDATION,
      'البيانات المرجعية غير صحيحة.',
      400
    );
  }

  // Default Supabase error
  return createError(
    ErrorType.SERVER,
    error.message || 'حدث خطأ في قاعدة البيانات.',
    500,
    { code: error.code }
  );
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت.';
    case ErrorType.VALIDATION:
      return 'البيانات المدخلة غير صحيحة.';
    case ErrorType.AUTHENTICATION:
      return 'يجب تسجيل الدخول أولاً.';
    case ErrorType.AUTHORIZATION:
      return 'ليس لديك صلاحية لهذا الإجراء.';
    case ErrorType.NOT_FOUND:
      return 'المورد المطلوب غير موجود.';
    case ErrorType.CONFLICT:
      return 'تعارض في البيانات.';
    case ErrorType.RATE_LIMIT:
      return 'تم تجاوز الحد المسموح. حاول لاحقاً.';
    case ErrorType.SERVER:
      return 'خطأ في الخادم. حاول لاحقاً.';
    default:
      return error.message || 'حدث خطأ غير متوقع.';
  }
}

/**
 * Log error for monitoring
 */
export function logError(error: AppError, context?: string): void {
  const logEntry = {
    timestamp: error.timestamp.toISOString(),
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    context,
    details: error.details,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Log]', logEntry);
  }

  // TODO: Send to error tracking service (Sentry, etc.)
  // sendToErrorTracking(logEntry);
}
