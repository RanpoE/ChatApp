import { Router } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { AuthedRequest } from '../middleware/requireAuth';
import { estimateTokens } from '../utils/tokenEstimate';

const router = Router();

const createMsgSchema = z.object({
  conversation_id: z.number().int().positive(),
  content: z.string().min(1).max(8000),
  role: z.enum(['user', 'assistant', 'system'])
});

// GET /messages?conversation_id=123&cursor=0&limit=50 (simple pagination)
router.get('/', async (req: AuthedRequest, res) => {
  const conversation_id = Number(req.query.conversation_id);
  const cursor = Number(req.query.cursor ?? 0);
  const limit = Math.min(Number(req.query.limit ?? 50), 100);

  // ownership check:
  const conv = await prisma.conversation.findFirst({ where: { id: conversation_id, user_id: req.user!.id } });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const messages = await prisma.message.findMany({
    where: { conversation_id },
    orderBy: { timestamp: 'asc' },
    skip: cursor,
    take: limit
  });
  res.json({ items: messages, nextCursor: messages.length === limit ? cursor + limit : null });
});

// POST /messages
router.post('/', async (req: AuthedRequest, res) => {
  const parsed = createMsgSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { conversation_id, content, role } = parsed.data;

  // ownership check
  const conv = await prisma.conversation.findFirst({ where: { id: conversation_id, user_id: req.user!.id } });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const msg = await prisma.message.create({
    data: {
      conversation_id,
      content,
      role,
      token_count: estimateTokens(content)
    }
  });

  // touch updated_at
  await prisma.conversation.update({ where: { id: conversation_id }, data: { updated_at: new Date() } });

  res.status(201).json(msg);
});

export default router;
