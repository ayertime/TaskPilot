import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { readEmails } from '../services/gmail-service';

export default async function emailRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/emails — Read user's emails via Gmail API
  app.get('/', async (req, reply) => {
    const userId = (req as any).userId as string;
    const query = req.query as Record<string, string>;

    const result = await readEmails(userId, {
      query: query.q || undefined,
      maxResults: query.limit ? parseInt(query.limit, 10) : 10,
      unreadOnly: query.unread === 'true',
    });

    if (!result.success) {
      reply.code(400).send({ error: result.message });
      return;
    }

    return { emails: result.emails || [], message: result.message };
  });

  // GET /api/emails/sent — Read user's sent emails
  app.get('/sent', async (req, reply) => {
    const userId = (req as any).userId as string;
    const query = req.query as Record<string, string>;

    const result = await readEmails(userId, {
      query: `in:sent ${query.q || ''}`.trim(),
      maxResults: query.limit ? parseInt(query.limit, 10) : 10,
    });

    if (!result.success) {
      reply.code(400).send({ error: result.message });
      return;
    }

    return { emails: result.emails || [], message: result.message };
  });
}
