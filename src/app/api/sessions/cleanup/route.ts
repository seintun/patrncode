import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/errors/api';
import { cleanupExpiredSessions } from '@/lib/session/expiry';

async function handler(_request: NextRequest, { guestId }: { guestId: string }): Promise<Response> {
  try {
    const result = await cleanupExpiredSessions(guestId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
    return NextResponse.json({ error: 'Failed to cleanup expired sessions' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
