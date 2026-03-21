import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createUserClient } from '../services/supabase';

const createCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().optional().default('folder'),
});

const updateCategorySchema = createCategorySchema.partial();

export default async function categoryRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/categories
  app.get('/', async (req, reply) => {
    try {
      const supabase = createUserClient((req as any).accessToken!);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      return data;
    } catch {
      reply.code(500).send({ error: 'Failed to fetch categories' });
    }
  });

  // POST /api/categories
  app.post('/', async (req, reply) => {
    try {
      const result = createCategorySchema.safeParse(req.body);
      if (!result.success) {
        reply.code(400).send({ error: 'Invalid category data', details: result.error.issues });
        return;
      }

      const supabase = createUserClient((req as any).accessToken!);
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...result.data, user_id: (req as any).userId })
        .select()
        .single();

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      reply.code(201).send(data);
    } catch {
      reply.code(500).send({ error: 'Failed to create category' });
    }
  });

  // PATCH /api/categories/:id
  app.patch('/:id', async (req, reply) => {
    try {
      const result = updateCategorySchema.safeParse(req.body);
      if (!result.success) {
        reply.code(400).send({ error: 'Invalid update data' });
        return;
      }

      const { id } = req.params as { id: string };
      const supabase = createUserClient((req as any).accessToken!);
      const { data, error } = await supabase
        .from('categories')
        .update(result.data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      return data;
    } catch {
      reply.code(500).send({ error: 'Failed to update category' });
    }
  });

  // DELETE /api/categories/:id
  app.delete('/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const supabase = createUserClient((req as any).accessToken!);
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      reply.code(204).send();
    } catch {
      reply.code(500).send({ error: 'Failed to delete category' });
    }
  });
}
