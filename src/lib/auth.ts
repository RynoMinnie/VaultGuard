import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export interface AuthUser {
  id: string;
  username: string;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate a session token and return the user
 */
export async function validateSession(
  token: string
): Promise<AuthUser | null> {
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
  };
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}