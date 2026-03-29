import { type NextRequest, NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  details?: unknown;
  status: number;
}

export class ApiErrorBase extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiErrorBase {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiErrorBase {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends ApiErrorBase {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

/**
 * Handle API errors and return a standardized JSON response
 */
export async function handleApiError(
  res: Response,
  error: unknown,
  context?: string,
): Promise<Response> {
  let status = res.status;
  let errorMessage = 'An unexpected error occurred';

  if (error instanceof ApiErrorBase) {
    status = error.status;
    errorMessage = error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const apiError: ApiError = {
    error: context ? `[${context}] ${errorMessage}` : errorMessage,
    status,
  };

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    apiError.details = {
      stack: error.stack,
      name: error.name,
    };
  }

  return NextResponse.json(apiError, { status });
}

/**
 * Wrapper for API route handlers to provide consistent error handling
 */
export function withErrorHandling(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('SOPHOCODE API ERROR:', error);
      return handleApiError(new Response('', { status: 500 }), error);
    }
  };
}

/**
 * Higher-order function for route handlers with params
 */
export function withErrorHandlingParams<T extends Record<string, string>>(
  handler: (req: NextRequest, params: Promise<T>) => Promise<Response>,
) {
  return async (req: NextRequest, params: Promise<T>): Promise<Response> => {
    try {
      return await handler(req, params);
    } catch (error) {
      console.error('SOPHOCODE API ERROR:', error);
      return handleApiError(new Response('', { status: 500 }), error);
    }
  };
}
/**
 * CUID/UUID validation regex
 * CUIDs usually start with 'c' and are ~25 chars.
 * CUID v2 starts with any letter and is ~24-32 chars.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{20,32}$/i;

/**
 * Validates if a string is a valid ID (UUID or CUID)
 */
export function validateId(id: string): boolean {
  return UUID_REGEX.test(id) || CUID_REGEX.test(id);
}

/**
 * @deprecated Use validateId instead. Supports both UUID and CUID for backward compatibility.
 */
export function validateUUID(id: string): boolean {
  return validateId(id);
}

export function withValidIdParams<T extends Record<string, string>>(
  handler: (req: NextRequest, context: { params: Promise<T> }) => Promise<Response>,
) {
  return async (req: NextRequest, context: { params: Promise<T> }): Promise<Response> => {
    const { id } = await context.params;

    if (id && !validateId(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    return handler(req, context);
  };
}

/**
 * @deprecated Use withValidIdParams instead.
 */
export function withUUIDParams<T extends Record<string, string>>(
  handler: (req: NextRequest, context: { params: Promise<T> }) => Promise<Response>,
) {
  return withValidIdParams(handler);
}
