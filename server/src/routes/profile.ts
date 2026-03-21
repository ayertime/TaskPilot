import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createUserClient } from '../services/supabase';

const updateProfileSchema = z.object({
  display_name: z.string().min(1).optional(),
  custom_avatar_url: z.string().nullable().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accent_color: z.string().optional(),
  timezone: z.string().optional(),
});

export default async function profileRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/profile
  app.get('/', async (req, reply) => {
    try {
      const supabase = createUserClient((req as any).accessToken!);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (req as any).userId!)
        .single();

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      return data;
    } catch {
      reply.code(500).send({ error: 'Failed to fetch profile' });
    }
  });

  // PATCH /api/profile
  app.patch('/', async (req, reply) => {
    try {
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        reply.code(400).send({ error: 'Invalid profile data', details: result.error.issues });
        return;
      }

      const supabase = createUserClient((req as any).accessToken!);
      const { data, error } = await supabase
        .from('profiles')
        .update(result.data)
        .eq('id', (req as any).userId!)
        .select()
        .single();

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      return data;
    } catch {
      reply.code(500).send({ error: 'Failed to update profile' });
    }
  });
}
