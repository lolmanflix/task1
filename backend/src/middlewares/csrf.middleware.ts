import { Request, Response, NextFunction } from 'express';

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // Some auth routes (login/signup/reset-password) intentionally don't have a session yet
  // so we should not block them with a CSRF failure. Allow those endpoints.
  const allowNoSession = ['/auth/login', '/auth/signup', '/auth/reset-password'];
  if (allowNoSession.includes(req.path)) return next();

  const header = req.headers['x-csrf-token'] as string | undefined;
  const cookie = (req as any).cookies?.['XSRF-TOKEN'];

  if (!header || !cookie || header !== cookie) {
    // log suspicious CSRF failures for analysis (don't leak tokens)
    // eslint-disable-next-line no-console
    console.warn(`Potential CSRF failure: ip=${req.ip} path=${req.path} method=${req.method}`);
    return res.status(403).json({ error: 'CSRF verification failed' });
  }

  return next();
}
