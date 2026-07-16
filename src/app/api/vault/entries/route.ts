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
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        encryptedData: true,
        iv: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Fetch entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

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

    const { encryptedData, iv } = await request.json();
    if (!encryptedData || !iv) {
      return NextResponse.json({ error: 'Missing encrypted data or IV' }, { status: 400 });
    }

    const entry = await db.vaultEntry.create({
      data: {
        userId: user.id,
        encryptedData,
        iv,
      },
    });

    return NextResponse.json({
      entry: {
        id: entry.id,
        encryptedData: entry.encryptedData,
        iv: entry.iv,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create entry error:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}