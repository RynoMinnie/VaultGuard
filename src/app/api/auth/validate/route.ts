import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { setSecurityHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return setSecurityHeaders(NextResponse.json({ valid: false }, { status: 401 }));
    }

    const user = await validateSession(token);
    if (!user) {
      return setSecurityHeaders(NextResponse.json({ valid: false }, { status: 401 }));
    }

    return setSecurityHeaders(NextResponse.json({ valid: true, user }));
  } catch (error) {
    console.error('Validation error:', error);
    return setSecurityHeaders(NextResponse.json({ valid: false }, { status: 401 }));
  }
}