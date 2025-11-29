import prisma from '../prisma/client';
import { comparePassword, hashPassword } from '../utils/hash';
import { signJwt } from '../utils/jwt';
import * as adminService from './admin.service';
import crypto from 'crypto';

// fallback in-memory session store used if Prisma session table is not available (dev only)
const fallbackSessions: Map<string, { adminId: string; refreshHash: string; csrfToken: string; expiresAt: Date }> = new Map();

export async function loginAdmin(email: string, password: string) {
  // Try to find admin in DB (if available)
  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      const ok = await comparePassword(password, admin.password);
      if (ok) {
        return { admin: { id: admin.id, email: admin.email } };
      }
      return null; // user found but wrong password
    }
  } catch (err) {
    // DB unreachable or other Prisma error — we'll check fallback in-memory list next
    // eslint-disable-next-line no-console
    console.warn('Prisma DB error while finding admin (will check fallback):', (err as Error).message);
  }

  // Check in-memory / fallback admins (created during signup when DB not reachable)
  try {
    const fallback = await adminService.findAdminByEmail(email);
    if (fallback && (fallback as any).passwordHash) {
      const ok = await comparePassword(password, (fallback as any).passwordHash);
      if (ok) {
        const id = (fallback as any).id || `dev-${Date.now()}`;
        return { admin: { id, email } };
      }
      return null;
    }
  } catch (err) {
    // ignore
  }

  // Fallback: support a dev-only admin when DB is unreachable or admin doesn't exist
  if (process.env.DEV_ADMIN_ENABLED === 'true') {
    const devEmail = process.env.DEV_ADMIN_EMAIL;
    const devPassword = process.env.DEV_ADMIN_PASSWORD;
    if (devEmail && devPassword && email === devEmail && password === devPassword) {
        const id = 'dev-admin';
        return { admin: { id, email: devEmail } };
    }
  }

  return null;
}

export async function resetAdminPassword(email: string, newPassword: string) {
  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      const hashed = await require('../utils/hash').hashPassword(newPassword);
      const updated = await prisma.admin.update({ where: { email }, data: { password: hashed } });
      return updated;
    }
  } catch (err) {
    // fall through to fallback
  }

  // fallback: update in-memory admin if present
  const fallback = await adminService.findAdminByEmail(email);
  if (!fallback) return null;
  const hashed = await require('../utils/hash').hashPassword(newPassword);
  // attempt to update via service if it supports fallback
  try {
    // The admin service uses fallback storage for development
    // We'll try delete + recreate to update passwordHash in fallback
    if ((fallback as any).id && (fallback as any).passwordHash) {
      // update existing fallback entry
      // Note: adminService doesn't export an update method; we can delete and recreate
      await adminService.deleteAdmin((fallback as any).id);
      const created = await adminService.createAdmin(email, newPassword);
      return created;
    }
  } catch (err) {
    return null;
  }
  return null;
}

// ---- session helpers (refresh tokens and csrf)
export async function createSession(adminId: string) {
  const sessionId = crypto.randomUUID();
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = await hashPassword(raw);
  const csrf = crypto.randomBytes(16).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  try {
    await (prisma as any).session.create({ data: { id: sessionId, adminId, refreshToken: hashed, csrfToken: csrf, expiresAt: expires } });
  } catch (err) {
    // fallback store — DO NOT store raw token in memory
    fallbackSessions.set(sessionId, { adminId, refreshHash: hashed, csrfToken: csrf, expiresAt: expires });
  }
  // return cookie-friendly value that contains sessionId + raw token
  return { sessionId, refreshToken: `${sessionId}:${raw}`, csrfToken: csrf, expiresAt: expires };
}

export async function rotateSession(sessionId: string) {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = await hashPassword(raw);
  const csrf = crypto.randomBytes(16).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  try {
    const s = await (prisma as any).session.update({ where: { id: sessionId }, data: { refreshToken: hashed, csrfToken: csrf, expiresAt: expires } });
    if (!s) return null;
  } catch (err) {
    const it = fallbackSessions.get(sessionId);
    if (!it) return null;
    fallbackSessions.set(sessionId, { ...it, refreshHash: hashed, csrfToken: csrf, expiresAt: expires });
  }
  return { refreshToken: `${sessionId}:${raw}`, csrfToken: csrf, expiresAt: expires };
}

export async function verifyRefreshCookie(cookieValue: string, csrfHeader?: string) {
  try {
    const [sessionId, raw] = (cookieValue || '').split(':');
    if (!sessionId || !raw) return null;
    let session: any;
    try {
      session = await (prisma as any).session.findUnique({ where: { id: sessionId } });
    } catch (err) {
      // try fallback
      const f = fallbackSessions.get(sessionId);
      if (!f) return null;
      session = { id: sessionId, adminId: f.adminId, refreshToken: f.refreshHash, csrfToken: f.csrfToken, expiresAt: f.expiresAt };
    }
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;
    // compare hashed refresh token
    const ok = await comparePassword(raw, session.refreshToken);
    if (!ok) return null;
    if (csrfHeader && csrfHeader !== session.csrfToken) return null;
    // return admin id and session
    return { adminId: session.adminId, sessionId: session.id };
  } catch (err) {
    return null;
  }
}

export async function revokeSession(sessionId: string) {
  try {
    try {
      const s = await (prisma as any).session.delete({ where: { id: sessionId } });
      return !!s;
    } catch (err) {
      if (fallbackSessions.has(sessionId)) {
        fallbackSessions.delete(sessionId);
        return true;
      }
      return false;
    }
  } catch (err) {
    return false;
  }
}

export async function pruneExpiredSessions() {
  try {
    // remove expired sessions from DB if prisma has session model
    await (prisma as any).session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch (err) {
    // ignore errors in dev when session table is not present
  }

  // cleanup fallback sessions
  for (const [id, s] of fallbackSessions.entries()) {
    if (s.expiresAt.getTime() < Date.now()) fallbackSessions.delete(id);
  }
}

export async function changeOwnPassword(adminId: string, currentPassword: string, newPassword: string) {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (admin) {
      const ok = await comparePassword(currentPassword, admin.password);
      if (!ok) return null;
      const hashed = await require('../utils/hash').hashPassword(newPassword);
      const updated = await prisma.admin.update({ where: { id: adminId }, data: { password: hashed } });
      return updated;
    }
  } catch (err) {
    // fall through to fallback
  }

  // fallback: check in-memory
  // adminId might be a fallback id
  const admins = await adminService.listAdmins();
  const found = admins.find((a: any) => a.id === adminId || a.email === adminId);
  if (!found) return null;
  // If it's from fallback have to check passwordHash (internal)
  // adminService doesn't expose passwordHash directly, so re-use findAdminByEmail
  const real = await adminService.findAdminByEmail(found.email);
  if (!real || !(real as any).passwordHash) return null;
  const ok = await comparePassword(currentPassword, (real as any).passwordHash);
  if (!ok) return null;
  // delete and recreate with new password
  await adminService.deleteAdmin(found.id);
  const created = await adminService.createAdmin(found.email, newPassword);
  return created;
}
