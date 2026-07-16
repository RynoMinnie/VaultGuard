import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const APP_VERSION = 'v0.1.0';

export async function GET() {
  try {
    // Ensure version record exists
    const existing = await db.appVersion.findUnique({
      where: { version: APP_VERSION },
    });

    if (!existing) {
      await db.appVersion.create({
        data: {
          version: APP_VERSION,
          description: 'Initial release - Core vault functionality with zero-knowledge encryption',
        },
      });
    }

    const versions = await db.appVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      currentVersion: APP_VERSION,
      versions,
    });
  } catch {
    return NextResponse.json({
      currentVersion: APP_VERSION,
      versions: [{ version: APP_VERSION, description: 'Initial release', createdAt: new Date().toISOString() }],
    });
  }
}