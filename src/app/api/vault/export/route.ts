import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await db.vaultEntry.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        encryptedData: true,
        iv: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      exportData: {
        version: 'v1.0.0',
        exportedAt: new Date().toISOString(),
        entryCount: entries.length,
        entries,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}