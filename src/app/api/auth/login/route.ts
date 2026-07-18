import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { rateLimit, setSecurityHeaders, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfter } = rateLimit(ip, 5, 60 * 1000);

    if (!allowed) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: `Too many attempts. Please try again in ${retryAfter} seconds.` },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        )
      );
    }

    const { username, passwordHash } = await request.json();

    if (!username || !passwordHash) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: 'Username and password are required' },
          { status: 400 }
        )
      );
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        )
      );
    }

    if (user.passwordHash !== passwordHash) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        )
      );
    }

    // Clean up old sessions for this user
    await db.session.deleteMany({ where: { userId: user.id } });

    const token = await createSession(user.id);

    return setSecurityHeaders(
      NextResponse.json({
        user: { id: user.id, username: user.username, encryptionSalt: user.encryptionSalt },
        token,
      })
    );
  } catch (error) {
    console.error('Login error:', error);
    return setSecurityHeaders(
      NextResponse.json(
        { error: 'Login failed' },
        { status: 500 }
      )
    );
  }
}