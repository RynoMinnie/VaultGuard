import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode, entries } = await request.json();

    if (!mode || !['merge', 'replace'].includes(mode) || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    if (mode === 'replace') {
      await db.vaultEntry.deleteMany({ where: { userId: user.id } });
    }

    let importedCount = 0;
    for (const entry of entries) {
      if (!entry.encryptedData || !entry.iv) continue;

      await db.vaultEntry.create({
        data: {
          userId: user.id,
          encryptedData: entry.encryptedData,
          iv: entry.iv,
          createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
        },
      });
      importedCount++;
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import' }, { status: 500 });
  }
}