import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, passwordHash, salt, encryptionSalt } = await request.json();

    if (!username || !passwordHash || !salt || !encryptionSalt) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
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

    return NextResponse.json({
      user: { id: user.id, username: user.username },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}