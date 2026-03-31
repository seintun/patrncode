import { prisma } from './src/lib/db/prisma';

async function test() {
  console.log('Testing Prisma session lookup...');
  try {
    const session = await prisma.session.findFirst({
      where: {
        status: 'IN_PROGRESS',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });
    console.log('✅ Success! Found session:', session || 'None (correct for empty DB)');
  } catch (error) {
    console.error('❌ Error during session lookup:', error);
    process.exit(1);
  }
}

test();
