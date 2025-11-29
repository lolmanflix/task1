import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';

export interface AuthRequest extends Request {
  admin?: { id: string; email: string; isAdmin: boolean };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // prefer Authorization header, fall back to http-only access cookie (ems_at)
    const header = req.headers.authorization;
    let token: string | undefined;
    if (header) {
      const parts = header.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth format' });
      token = parts[1];
    } else if ((req as any).cookies && (req as any).cookies.ems_at) {
      token = (req as any).cookies.ems_at;
    } else {
      return res.status(401).json({ error: 'Missing Authorization' });
    }
    const secret = process.env.JWT_SECRET!;
    const payload = verifyJwt<{ id: string; email: string }>(token!, secret);
    req.admin = { id: payload.id, email: payload.email, isAdmin: true };
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized', detail: err.message });
  }
}
