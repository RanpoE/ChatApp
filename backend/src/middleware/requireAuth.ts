import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt';

export type AuthedRequest = Request & { user?: { id: number; username: string } };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = header.slice(7);
  try {
    const { sub, username } = verifyAccessToken(token);
    req.user = { id: sub, username };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid/expired token' });
  }
}
