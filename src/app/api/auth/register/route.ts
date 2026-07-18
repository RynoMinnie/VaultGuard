import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { rateLimit, setSecurityHeaders, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfter } = rateLimit(ip, 3, 60 * 1000);

    if (!allowed) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: `Too many attempts. Please try again in ${retryAfter} seconds.` },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        )
      );
    }

    const { username, passwordHash, salt, encryptionSalt } = await request.json();

    if (!username || !passwordHash || !salt || !encryptionSalt) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        )
      );
    }

    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        )
      );
    }

    const user = await db.user.create({
      data: {
        username,
        passwordHash,
        salt,
        encryptionSalt,
      },
    });

    const token = await createSession(user.id);

    return setSecurityHeaders(
      NextResponse.json({
        user: { id: user.id, username: user.username },
        token,
      })
    );
  } catch (error) {
    console.error('Registration error:', error);
    return setSecurityHeaders(
      NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      )
    );
  }
}