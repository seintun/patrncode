/**
 * Structured logging for Vercel log drain capture.
 * All logs are JSON-formatted for easy parsing.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogFields {
  sessionId?: string;
  guestId?: string;
  tokensUsed?: number;
  latencyMs?: number;
  model?: string;
  statusCode?: number;
  error?: string;
  route?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, fields: LogFields = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    process.stdout.write(line + '\n');
  }
}

export function logInfo(message: string, fields?: LogFields): void {
  log('info', message, fields);
}

export function logWarn(message: string, fields?: LogFields): void {
  log('warn', message, fields);
}

export function logError(message: string, fields?: LogFields): void {
  log('error', message, fields);
}
