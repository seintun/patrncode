import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/errors/api';

/**
 * Admin metrics endpoint — returns token usage and session stats.
 * Protection: In production, require ADMIN_SECRET header.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
      const provided = request.headers.get('x-admin-secret');
      if (provided !== adminSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tokenUsage = await prisma.userProfile.aggregate({
      _sum: { tokensUsed: true },
      _count: { _all: true },
      where: { lastActivityAt: { gte: twentyFourHoursAgo } },
    });

    const topUsers = await prisma.userProfile.findMany({
      where: { lastActivityAt: { gte: twentyFourHoursAgo } },
      orderBy: { tokensUsed: 'desc' },
      take: 10,
      select: {
        guestId: true,
        tokensUsed: true,
        tokenLimit: true,
        tier: true,
        lastActivityAt: true,
      },
    });

    const sessionStats = await prisma.session.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { startedAt: { gte: twentyFourHoursAgo } },
    });

    const activeSessions = await prisma.session.count({
      where: {
        status: 'IN_PROGRESS',
        expiresAt: { gt: new Date() },
      },
    });

    return NextResponse.json({
      period: '24h',
      tokenUsage: {
        total: tokenUsage._sum.tokensUsed ?? 0,
        activeUsers: tokenUsage._count._all,
      },
      topUsers,
      sessions: {
        active: activeSessions,
        byStatus: Object.fromEntries(sessionStats.map((s) => [s.status, s._count._all])),
      },
    });
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'GET /api/admin/metrics');
  }
}
