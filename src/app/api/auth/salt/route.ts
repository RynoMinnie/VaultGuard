import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSecurityHeaders } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');
    if (!username) {
      return setSecurityHeaders(
        NextResponse.json({ error: 'Username is required' }, { status: 400 })
      );
    }

    const user = await db.user.findUnique({
      where: { username },
      select: { salt: true, encryptionSalt: true },
    });

    if (!user) {
      return setSecurityHeaders(
        NextResponse.json({ error: 'User not found' }, { status: 404 })
      );
    }

    return setSecurityHeaders(
      NextResponse.json({
        salt: user.salt,
        encryptionSalt: user.encryptionSalt,
      })
    );
  } catch (error) {
    console.error('Salt fetch error:', error);
    return setSecurityHeaders(
      NextResponse.json({ error: 'Failed to fetch salt' }, { status: 500 })
    );
  }
}