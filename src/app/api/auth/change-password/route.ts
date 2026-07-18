import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSession, createSession } from '@/lib/auth';
import { setSecurityHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { token, oldPasswordHash, newPasswordHash, newSalt, newEncryptionSalt, reEncryptedEntries } = await request.json();

    if (!token || !oldPasswordHash || !newPasswordHash || !newSalt || !newEncryptionSalt) {
      return setSecurityHeaders(
        NextResponse.json({ error: 'All fields are required' }, { status: 400 })
      );
    }

    const user = await validateSession(token);
    if (!user) {
      return setSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.passwordHash !== oldPasswordHash) {
      return setSecurityHeaders(
        NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
      );
    }

    // Update user credentials
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        salt: newSalt,
        encryptionSalt: newEncryptionSalt,
      },
    });

    // Re-encrypt all entries if provided
    if (reEncryptedEntries && Array.isArray(reEncryptedEntries)) {
      for (const entry of reEncryptedEntries) {
        await db.vaultEntry.update({
          where: { id: entry.id, userId: user.id },
          data: {
            encryptedData: entry.encryptedData,
            iv: entry.iv,
          },
        });
      }
    }

    // Create new session
    await db.session.deleteMany({ where: { userId: user.id } });
    const newToken = await createSession(user.id);

    return setSecurityHeaders(
      NextResponse.json({ success: true, token: newToken })
    );
  } catch (error) {
    console.error('Change password error:', error);
    return setSecurityHeaders(
      NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
    );
  }
}