import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createUserClient, supabaseAdmin } from '../services/supabase';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  due_date: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  parent_task_id: z.string().nullable().optional(),
  is_automatable: z.boolean().optional().default(true),
  auto_execute_at: z.string().nullable().optional(),
  action_type: z.string().nullable().optional(),
  action_metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  recurrence_pattern: z.string().nullable().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const reorderSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['todo', 'in_progress', 'done']),
      position: z.number().int().min(0),
    })
  ),
});

export default async function taskRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/tasks
  app.get('/', async (req, reply) => {
    try {
      const supabase = createUserClient((req as any).accessToken!);
      const { status, category_id, priority } = req.query as Record<string, string>;

      let query = supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });

      if (status) query = query.eq('status', status);
      if (category_id) query = query.eq('category_id', category_id);
      if (priority) query = query.eq('priority', priority);

      const { data, error } = await query;
      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      return data;
    } catch {
      reply.code(500).send({ error: 'Failed to fetch tasks' });
    }
  });

  // POST /api/tasks
  app.post('/', async (req, reply) => {
    try {
      const result = createTaskSchema.safeParse(req.body);
      if (!result.success) {
        reply.code(400).send({ error: 'Invalid task data', details: result.error.issues });
        return;
      }

      const supabase = createUserClient((req as any).accessToken!);

      const { data: existing } = await supabase
        .from('tasks')
        .select('position')
        .eq('status', result.data.status!)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const position = (existing?.position ?? -1) + 1;

      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...result.data, user_id: (req as any).userId, position })
        .select()
        .single();

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      reply.code(201).send(data);
    } catch {
      reply.code(500).send({ error: 'Failed to create task' });
    }
  });

  // DELETE /api/tasks/completed — bulk-delete all done tasks
  app.delete('/completed', async (req, reply) => {
    try {
      const userId = (req as any).userId as string;
      const { error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'done');

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      reply.code(204).send();
    } catch {
      reply.code(500).send({ error: 'Failed to clear completed tasks' });
    }
  });

  // PATCH /api/tasks/reorder (must be before /:id)
  app.patch('/reorder', async (req, reply) => {
    try {
      const result = reorderSchema.safeParse(req.body);
      if (!result.success) {
        reply.code(400).send({ error: 'Invalid reorder data' });
        return;
      }

      const supabase = createUserClient((req as any).accessToken!);

      await Promise.all(
        result.data.tasks.map((task) =>
          supabase
            .from('tasks')
            .update({ status: task.status, position: task.position })
            .eq('id', task.id)
        )
      );

      return { success: true };
    } catch {
      reply.code(500).send({ error: 'Failed to reorder tasks' });
    }
  });

  // POST /api/tasks/:id/complete
  app.post('/:id/complete', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).userId;

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: 'user',
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      return data;
    } catch {
      reply.code(500).send({ error: 'Failed to complete task' });
    }
  });

  // PATCH /api/tasks/:id
  app.patch('/:id', async (req, reply) => {
    try {
      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        reply.code(400).send({ error: 'Invalid update data', details: result.error.issues });
        return;
      }

      const { id } = req.params as { id: string };
      const supabase = createUserClient((req as any).accessToken!);

      const { data, error } = await supabase
        .from('tasks')
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
      reply.code(500).send({ error: 'Failed to update task' });
    }
  });

  // DELETE /api/tasks/:id
  app.delete('/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).userId;
      console.log('[DELETE] task id:', id, 'user:', userId);

      const { error, status, statusText } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      console.log('[DELETE] supabase response:', { error, status, statusText });

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }
      reply.code(204).send();
    } catch (err) {
      console.error('[DELETE] exception:', err);
      reply.code(500).send({ error: 'Failed to delete task' });
    }
  });
}
