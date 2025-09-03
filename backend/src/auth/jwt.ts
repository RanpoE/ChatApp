import jwt, { type Secret, type JwtPayload, type SignOptions } from "jsonwebtoken";

const SECRET: Secret = process.env.JWT_SECRET as Secret;
const ACCESS_TTL = '1h';
const REFRESH_TTL = process.env.REFRESH_TTL || '7d';

export type Claims = { sub: number; username: string };

export const signAccessToken = (payload: Claims) =>
  jwt.sign(payload as object, SECRET, { expiresIn: ACCESS_TTL } as SignOptions);
export const signRefreshToken = (payload: Claims) =>
  jwt.sign(payload as object, SECRET, { expiresIn: REFRESH_TTL } as SignOptions);

export function verifyAccessToken(token: string): Claims {
  const decoded = jwt.verify(token, SECRET) as JwtPayload & { sub?: string | number; username?: string };
  const subRaw = decoded?.sub;
  const sub = typeof subRaw === 'number' ? subRaw : Number(subRaw);
  const username = decoded?.username;
  if (!Number.isFinite(sub) || typeof username !== 'string') {
    throw new Error('Invalid/expired token');
  }
  return { sub, username };
}

export function verifyRefreshToken(token: string): Claims {
  const decoded = jwt.verify(token, SECRET) as JwtPayload & { sub?: string | number; username?: string };
  const subRaw = decoded?.sub;
  const sub = typeof subRaw === 'number' ? subRaw : Number(subRaw);
  const username = decoded?.username;
  if (!Number.isFinite(sub) || typeof username !== 'string') {
    throw new Error('Invalid/expired refresh token');
  }
  return { sub, username };
}
