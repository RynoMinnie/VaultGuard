import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { setSecurityHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (token) {
      await deleteSession(token);
    }
    return setSecurityHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Logout error:', error);
    return setSecurityHeaders(NextResponse.json({ success: true }));
  }
}