import { type NextRequest, NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  details?: unknown;
  status: number;
}

/**
 * Handle API errors and return a standardized JSON response
 */
export async function handleApiError(
  res: Response,
  error: unknown,
  context?: string,
): Promise<Response> {
  const status = res.status;
  let errorMessage = 'An unexpected error occurred';

  if (error instanceof Error) {
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
