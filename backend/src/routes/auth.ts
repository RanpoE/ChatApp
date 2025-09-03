import { Router } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { hashPassword, verifyPassword } from "../auth/passwords"
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../auth/jwt';

const router = Router();

const credsSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128)
});

// POST /auth/register
router.post('/register', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { username, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ error: 'Username taken' });

  const password_hash = await hashPassword(password);
  const user = await prisma.user.create({ data: { username, password_hash } });

  const token = signAccessToken({ sub: user.id, username: user.username });
  const refreshToken = signRefreshToken({ sub: user.id, username: user.username });
  res.status(201).json({ token, refreshToken, user: { id: user.id, username: user.username, created_at: user.created_at } });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(user.password_hash, password)))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = signAccessToken({ sub: user.id, username: user.username });
  const refreshToken = signRefreshToken({ sub: user.id, username: user.username });
  res.json({ token, refreshToken, user: { id: user.id, username: user.username, created_at: user.created_at } });
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'Missing refreshToken' });
  }
  try {
    const { sub, username } = verifyRefreshToken(refreshToken);
    const token = signAccessToken({ sub, username });
    const newRefreshToken = signRefreshToken({ sub, username });
    return res.json({ token, refreshToken: newRefreshToken });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid/expired refresh token' });
  }
});

export default router;
