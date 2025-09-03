import { Router } from "express";
import { prisma } from "../db";

import { includes, z } from "zod"

import { AuthedRequest } from "../middleware/requireAuth";
import { estimateTokens } from "../utils/tokenEstimate";
import { callModel } from "../utils/llm";

const router = Router();


const createConvScheme = z.object({ title: z.string().min(1).max(120) })

router.get("/", async (req: AuthedRequest, res) => {
    const list = await prisma.conversation.findMany({
        where: { user_id: req.user!.id },
        orderBy: { updated_at: 'desc' }
    });
    res.json(list)
})

router.post("/", async (req: AuthedRequest, res) => {
    const parsed = createConvScheme.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues })
    const conv = await prisma.conversation.create({
        data: { user_id: req.user!.id, title: parsed.data?.title }
    })
    res.status(200).json(conv)
})

router.get("/:id", async (req: AuthedRequest, res) => {
    const id = Number(req.params.id)
    const conv = await prisma.conversation.findFirst({
        where: { id, user_id: req.user!.id },
        include: { messages: { orderBy: { timestamp: 'desc' } } }
    })
    if (!conv) return res.status(404).json({ error: "Not found" })
    res.json(conv)
})

router.patch("/:id", async (req: AuthedRequest, res) => {
    const id = Number(req.params.id)
    const title = String(req.body.title ?? '')
    if (!title) return res.status(400).json({ error: 'Title was required' })
    const conv = await prisma.conversation.update({
        where: { id },
        data: { title }
    })
    res.json(conv)
})

router.delete('/:id', async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  // Ensure belongs to user:
  const owned = await prisma.conversation.findFirst({ where: { id, user_id: req.user!.id } });
  if (!owned) return res.status(404).json({ error: 'Not found' });
  await prisma.conversation.delete({ where: { id } });
  res.status(204).end();
});

// POST /conversations/:id/messages → send a message and get AI response
router.post('/:id/messages', async (req: AuthedRequest, res) => {
  const conversationId = Number(req.params.id);
  const content = String(req.body?.content ?? '').trim();
  if (!Number.isFinite(conversationId)) return res.status(400).json({ error: 'Invalid conversation id' });
  if (!content) return res.status(400).json({ error: 'content required' });

  // Ensure convo belongs to the authenticated user
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, user_id: req.user!.id }
  });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  // 1) Store the user's message
  const userMsg = await prisma.message.create({
    data: {
      conversation_id: conversationId,
      content,
      role: 'user',
      token_count: estimateTokens(content)
    }
  });

  // 2) Build recent context (last 50 messages, oldest→newest)
  const recentDesc = await prisma.message.findMany({
    where: { conversation_id: conversationId },
    orderBy: { timestamp: 'desc' },
    take: 50
  });
  const context = recentDesc.reverse().map(m => ({
    role: m.role as 'system'|'user'|'assistant',
    content: m.content
  }));

  // 3) Call the model
  const assistantText = await callModel(context) ?? 'Error';

  // 4) Store assistant reply
  const aiMsg = await prisma.message.create({
    data: {
      conversation_id: conversationId,
      content: assistantText,
      role: 'assistant',
      token_count: estimateTokens(assistantText)
    }
  });

  // 5) Touch updated_at
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updated_at: new Date() }
  });

  return res.status(201).json({ user: userMsg, assistant: aiMsg });
});



export default router