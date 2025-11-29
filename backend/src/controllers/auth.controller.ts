import { Request, Response } from 'express';
import { z } from 'zod';
import { loginAdmin, createSession, verifyRefreshCookie, rotateSession, revokeSession } from '../services/auth.service';
import prisma from '../prisma/client';
import { signJwt } from '../utils/jwt';
import { createAdmin } from '../services/admin.service';
import { resetAdminPassword } from '../services/auth.service';
import { changeOwnPassword } from '../services/auth.service';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const UpdateProfileSchema = z.object({
  email: z.string().email().optional(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6).optional()
}).refine((data) => !!data.email || (!!data.currentPassword && !!data.newPassword), {
  message: 'Provide a new email or both current and new password'
}).refine((data) => !(data.newPassword && !data.currentPassword), {
  message: 'Current password is required to set a new password',
  path: ['currentPassword']
});

export async function loginHandler(req: Request, res: Response) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const result = await loginAdmin(parsed.data.email, parsed.data.password);

  if (!result) return res.status(401).json({ error: 'Invalid credentials' });

  // create server-side session + issue access (short) and refresh tokens as cookies
  const admin = { ...result.admin, isAdmin: true };
  // access token short lived (15m)
  const access = signJwt({ id: admin.id, email: admin.email }, process.env.JWT_SECRET || 'secret', '15m');

  // create refresh session entry and get raw refresh token
  const session = await createSession(admin.id);

  const sameSiteMode = (process.env.NODE_ENV === 'production') ? ('strict' as const) : ('lax' as const);
  const accessOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 15, path: '/' };
  const refreshOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 60 * 24 * 7, path: '/' };

  res.cookie('ems_at', access, accessOpts);
  res.cookie('ems_rt', session.refreshToken, refreshOpts);
  // csrf cookie (readable by JS) - double submit cookie
  // readable JS cookie used for double-submit CSRF protections. keep httpOnly=false
  res.cookie('XSRF-TOKEN', session.csrfToken, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 60 * 24 * 7, path: '/' });
  return res.json({ admin });
}

export async function signupHandler(req: Request, res: Response) {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  // Create admin (if exists createAdmin will error, so handle)
  try {
    const admin = await createAdmin(parsed.data.email, parsed.data.password);
    // create session + access + refresh cookie on signup
    const newAdmin = admin as any;
    const access = signJwt({ id: newAdmin.id, email: parsed.data.email }, process.env.JWT_SECRET || 'secret', '15m');
    const session = await createSession(newAdmin.id);
    const sameSiteMode = (process.env.NODE_ENV === 'production') ? ('strict' as const) : ('lax' as const);
    const accessOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 15, path: '/' };
    const refreshOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 60 * 24 * 7, path: '/' };
    res.cookie('ems_at', access, accessOpts);
    res.cookie('ems_rt', session.refreshToken, refreshOpts);
    res.cookie('XSRF-TOKEN', session.csrfToken, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 60 * 24 * 7, path: '/' });
    return res.status(201).json({ admin: { id: newAdmin.id, email: parsed.data.email, isAdmin: true } });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not create admin' });
  }
}
const ResetSchema = z.object({
  email: z.string().email()
});

export async function resetPasswordHandler(req: any, res: any) {
  const parsed = ResetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!serviceRole || !supabaseUrl) {
    return res.status(500).json({ error: 'Supabase credentials are not configured on the server' });
  }

  const redirectTo = process.env.SUPABASE_RESET_REDIRECT || process.env.FRONTEND_ORIGIN || 'http://localhost:3000/login';

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': serviceRole,
        'Authorization': `Bearer ${serviceRole}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'recovery', email: parsed.data.email, options: { redirect_to: redirectTo } })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unexpected Supabase error' }));
      return res.status(response.status).json({ error: err.error || 'Failed to request reset link' });
    }

    return res.json({ ok: true, message: 'Reset link sent if the email exists' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to contact Supabase' });
  }
}

export async function changePasswordHandler(req: any, res: any) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  const admin = req.admin;
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  const updated = await changeOwnPassword(admin.id, currentPassword, newPassword);
  if (!updated) return res.status(400).json({ error: 'Invalid current password or could not change' });
  res.json({ ok: true });
}

export async function meHandler(req: any, res: any) {
  // requireAuth middleware should populate req.admin
  const admin = req.admin;
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ admin });
}

export async function logoutHandler(req: any, res: Response) {
  // if refresh cookie exists, try revoke session
  const cookie = req.cookies?.ems_rt;
  if (cookie) {
    const [sessionId] = cookie.split(':');
    try { await revokeSession(sessionId); } catch (_) { /* ignore */ }
  }
  res.clearCookie('ems_at');
  res.clearCookie('ems_rt');
  res.clearCookie('XSRF-TOKEN');
  res.json({ ok: true });
}

export async function refreshHandler(req: any, res: Response) {
  // expected: ems_rt cookie present and x-csrf-token header
  const cookie = req.cookies?.ems_rt;
  const csrfHeader = req.headers['x-csrf-token'] as string | undefined;
  if (!cookie) return res.status(401).json({ error: 'Missing refresh token' });

  const v = await verifyRefreshCookie(cookie, csrfHeader);
  if (!v) return res.status(401).json({ error: 'Invalid refresh / csrf' });

  // rotate session tokens
  const rotated = await rotateSession(v.sessionId);
  if (!rotated) return res.status(500).json({ error: 'Could not rotate session' });

  // issue new access token
  const admin = await prisma.admin.findUnique({ where: { id: v.adminId } });
  if (!admin) return res.status(401).json({ error: 'User not found' });
  const access = signJwt({ id: admin.id, email: admin.email }, process.env.JWT_SECRET || 'secret', '15m');

  const sameSiteMode = (process.env.NODE_ENV === 'production') ? ('strict' as const) : ('lax' as const);
  const accessOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 15, path: '/' };
  const refreshOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 60 * 24 * 7, path: '/' };

  res.cookie('ems_at', access, accessOpts);
  res.cookie('ems_rt', rotated.refreshToken, refreshOpts);
  res.cookie('XSRF-TOKEN', rotated.csrfToken, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 60 * 24 * 7, path: '/' });

  return res.json({ admin: { id: admin.id, email: admin.email, isAdmin: true } });
}

export async function updateProfileHandler(req: any, res: Response) {
  const parsed = UpdateProfileSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const authAdmin = req.admin;
  if (!authAdmin) return res.status(401).json({ error: 'Unauthorized' });

  let nextEmail = authAdmin.email;

  if (parsed.data.email && parsed.data.email !== authAdmin.email) {
    try {
      const updated = await prisma.admin.update({ where: { id: authAdmin.id }, data: { email: parsed.data.email } });
      nextEmail = updated.email;
    } catch (err: any) {
      return res.status(400).json({ error: err?.meta?.cause || 'Could not update email' });
    }
  }

  if (parsed.data.newPassword && parsed.data.currentPassword) {
    const changed = await changeOwnPassword(authAdmin.id, parsed.data.currentPassword, parsed.data.newPassword);
    if (!changed) return res.status(400).json({ error: 'Current password is incorrect' });
  }

  // issue a fresh access token so req.admin reflects updated email
  const sameSiteMode = (process.env.NODE_ENV === 'production') ? ('strict' as const) : ('lax' as const);
  const access = signJwt({ id: authAdmin.id, email: nextEmail }, process.env.JWT_SECRET || 'secret', '15m');
  const accessOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: sameSiteMode, maxAge: 1000 * 60 * 15, path: '/' };
  res.cookie('ems_at', access, accessOpts);

  return res.json({ admin: { id: authAdmin.id, email: nextEmail, isAdmin: true } });
}
