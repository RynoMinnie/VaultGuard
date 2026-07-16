import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true, user });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}