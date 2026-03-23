import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { readCalendarEvents } from '../services/gcalendar-service';

export default async function calendarRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/calendar — Read user's calendar events
  app.get('/', async (req, reply) => {
    const userId = (req as any).userId as string;
    const query = req.query as Record<string, string>;

    const result = await readCalendarEvents(userId, {
      timeMin: query.time_min || undefined,
      timeMax: query.time_max || undefined,
      maxResults: query.limit ? parseInt(query.limit, 10) : 15,
      query: query.q || undefined,
    });

    if (!result.success) {
      reply.code(400).send({ error: result.message });
      return;
    }

    return { events: result.events || [], message: result.message };
  });
}
