import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGuestIdFromCookie } from '@/lib/guest';

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
 * Higher-order function for routes requiring a Guest Session.
 * Injects guestId into the handler context.
 */
export function withAuth(
  handler: (req: NextRequest, context: { guestId: string }) => Promise<Response>,
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const cookieStore = await cookies();
      const guestId = getGuestIdFromCookie(cookieStore);

      if (!guestId) {
        return NextResponse.json({ error: 'Unauthorized: Guest ID missing' }, { status: 401 });
      }

      return await handler(req, { guestId });
    } catch (error) {
      return handleApiError(new Response('', { status: 500 }), error);
    }
  };
}

/**
 * CUID/UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{20,32}$/i;

export function validateId(id: string): boolean {
  return UUID_REGEX.test(id) || CUID_REGEX.test(id);
}

/**
 * Higher-order function for routes with dynamic IDs.
 */
export function withValidIdParams<T extends Record<string, string>>(
  handler: (
    req: NextRequest,
    context: { params: Promise<T>; guestId?: string },
  ) => Promise<Response>,
) {
  return async (
    req: NextRequest,
    context: { params: Promise<T>; guestId?: string },
  ): Promise<Response> => {
    const { id } = await context.params;

    if (id && !validateId(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    return handler(req, context);
  };
}

/**
 * Combined Auth + Valid ID Params HOC
 */
export function withAuthAndId<T extends Record<string, string>>(
  handler: (
    req: NextRequest,
    context: { params: Promise<T>; guestId: string },
  ) => Promise<Response>,
) {
  return async (req: NextRequest, context: { params: Promise<T> }): Promise<Response> => {
    try {
      const cookieStore = await cookies();
      const guestId = getGuestIdFromCookie(cookieStore);

      if (!guestId) {
        return NextResponse.json({ error: 'Unauthorized: Guest ID missing' }, { status: 401 });
      }

      const { id } = await context.params;
      if (id && !validateId(id)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
      }

      return await handler(req, { ...context, guestId });
    } catch (error) {
      return handleApiError(new Response('', { status: 500 }), error);
    }
  };
}
