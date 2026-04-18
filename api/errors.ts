/**
 * Custom error handling for API endpoints
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code || 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'المورد غير موجود', code?: string) {
    super(message, 404, code || 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'غير مصرح', code?: string) {
    super(message, 401, code || 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'ممنوع', code?: string) {
    super(message, 403, code || 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'تم تجاوز الحد المسموح من الطلبات', code?: string) {
    super(message, 429, code || 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'انتهت المهلة الزمنية', code?: string) {
    super(message, 504, code || 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'خطأ في الخدمة الخارجية', code?: string) {
    super(message, 502, code || 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
  details?: any;
}

export function formatError(error: any): ErrorResponse {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // Handle Zod validation errors
  if (error?.name === 'ZodError') {
    return {
      success: false,
      error: 'خطأ في التحقق من البيانات',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: error.errors,
    };
  }

  // Handle timeout errors
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    return {
      success: false,
      error: 'انتهت المهلة الزمنية',
      code: 'TIMEOUT',
      statusCode: 504,
    };
  }

  // Handle network errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return {
      success: false,
      error: 'خطأ في الاتصال بالشبكة',
      code: 'NETWORK_ERROR',
      statusCode: 503,
    };
  }

  // Handle JSON parsing errors
  if (error?.name === 'SyntaxError' && error?.message?.includes('JSON')) {
    return {
      success: false,
      error: 'خطأ في معالجة البيانات',
      code: 'JSON_PARSE_ERROR',
      statusCode: 400,
    };
  }

  // Default error
  return {
    success: false,
    error: error?.message || 'خطأ غير متوقع',
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
  };
}

/**
 * Logger for errors
 */
export function logError(error: any, context?: string) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    name: error?.name,
    message: error?.message,
    code: error?.code,
    statusCode: error?.statusCode,
    stack: error?.stack,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', errorInfo);
  }

  // TODO: Send to error tracking service (Sentry, etc.)
  // sendToErrorTracking(errorInfo);

  return errorInfo;
}

/**
 * Safe async wrapper
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ success: true; data: T } | { success: false; error: ErrorResponse }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    logError(error, context);
    return { success: false, error: formatError(error) };
  }
}
