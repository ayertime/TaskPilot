import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { sendDraft, cancelDraft, updateDraft } from '../services/email-draft-service';
import { z } from 'zod';

const updateDraftSchema = z.object({
  to: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  cc: z.string().nullable().optional(),
  bcc: z.string().nullable().optional(),
});

export default async function draftRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/drafts — list pending drafts for the user
  app.get('/', async (req, reply) => {
    try {
      const userId = (req as any).userId as string;

      const { data, error } = await supabaseAdmin
        .from('email_drafts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending_review')
        .order('review_deadline', { ascending: true });

      if (error) {
        reply.code(500).send({ error: 'Failed to fetch drafts' });
        return;
      }
      return { drafts: data || [] };
    } catch {
      reply.code(500).send({ error: 'Failed to fetch drafts' });
    }
  });

  // POST /api/drafts/:id/send — manually send a draft now
  app.post('/:id/send', async (req, reply) => {
    const userId = (req as any).userId as string;
    const { id } = req.params as { id: string };

    const result = await sendDraft(id, userId);
    if (!result.success) {
      reply.code(400).send({ error: result.message });
      return;
    }
    return result;
  });

  // POST /api/drafts/:id/cancel — cancel a draft
  app.post('/:id/cancel', async (req, reply) => {
    const userId = (req as any).userId as string;
    const { id } = req.params as { id: string };

    const result = await cancelDraft(id, userId);
    if (!result.success) {
      reply.code(400).send({ error: result.message });
      return;
    }
    return result;
  });

  // PATCH /api/drafts/:id — edit a draft's content
  app.patch('/:id', async (req, reply) => {
    const userId = (req as any).userId as string;
    const { id } = req.params as { id: string };

    const parsed = updateDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid update data' });
      return;
    }

    const updates = {
      ...parsed.data,
      cc: parsed.data.cc ?? undefined,
      bcc: parsed.data.bcc ?? undefined,
    };
    const result = await updateDraft(id, userId, updates);
    if (!result.success) {
      reply.code(400).send({ error: result.message });
      return;
    }
    return result;
  });
}
