import prisma from '../prisma/client';
import { hashPassword } from '../utils/hash';

// In-memory fallback for development when DB is unavailable. Not persistent!
const fallbackAdmins: Array<{ id: string; email: string; passwordHash?: string; created_at: Date }> = [];

export async function listAdmins() {
  try {
    return await prisma.admin.findMany({ orderBy: { created_at: 'desc' } });
  } catch (err) {
    // Return fallback list - include DEV_ADMIN if configured
    const devEnabled = process.env.DEV_ADMIN_ENABLED === 'true';
    const list = [...fallbackAdmins];
    if (devEnabled && process.env.DEV_ADMIN_EMAIL) {
      list.unshift({ id: 'dev-admin', email: process.env.DEV_ADMIN_EMAIL, created_at: new Date() });
    }
    // hide passwordHash when returning
    return list.map((a: any) => ({ id: a.id, email: a.email, created_at: a.created_at }));
  }
}

export async function createAdmin(email: string, password: string) {
  try {
    const hashed = await hashPassword(password);
    return await prisma.admin.create({ data: { email, password: hashed } });
  } catch (err) {
    // When DB isn't reachable, create in-memory admin for testing
    const id = `dev-${Date.now()}`;
    const created_at = new Date();
    const hashed = await hashPassword(password);
    fallbackAdmins.unshift({ id, email, passwordHash: hashed, created_at });
    return { id, email, created_at, passwordHash: hashed } as any;
  }
}

export async function findAdminByEmail(email: string) {
  try {
    return await prisma.admin.findUnique({ where: { email } });
  } catch (err) {
    const found = fallbackAdmins.find((a) => a.email === email);
    return found || null;
  }
}

export async function deleteAdmin(id: string) {
  try {
    return await prisma.admin.delete({ where: { id } });
  } catch (err) {
    const idx = fallbackAdmins.findIndex((a) => a.id === id);
    if (idx === -1) throw err;
    const item = fallbackAdmins[idx];
    fallbackAdmins.splice(idx, 1);
    return item;
  }
}
