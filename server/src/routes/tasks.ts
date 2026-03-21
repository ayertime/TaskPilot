import { Router, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createUserClient } from '../services/supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware as any);

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  due_date: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  parent_task_id: z.string().nullable().optional(),
  is_automatable: z.boolean().optional().default(false),
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

// GET /api/tasks
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = createUserClient(req.accessToken!);
    const { status, category_id, priority } = req.query;

    let query = supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true });

    if (status) query = query.eq('status', status as string);
    if (category_id) query = query.eq('category_id', category_id as string);
    if (priority) query = query.eq('priority', priority as string);

    const { data, error } = await query;
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = createTaskSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid task data', details: result.error.issues });
      return;
    }

    const supabase = createUserClient(req.accessToken!);

    // Get max position for the status column
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
      .insert({ ...result.data, user_id: req.userId, position })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
  } catch {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/reorder (must be before /:id)
router.patch('/reorder', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = reorderSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid reorder data' });
      return;
    }

    const supabase = createUserClient(req.accessToken!);

    await Promise.all(
      result.data.tasks.map((task) =>
        supabase
          .from('tasks')
          .update({ status: task.status, position: task.position })
          .eq('id', task.id)
      )
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// PATCH /api/tasks/:id/complete
router.patch('/:id/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = createUserClient(req.accessToken!);

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by: 'user',
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = updateTaskSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid update data', details: result.error.issues });
      return;
    }

    const supabase = createUserClient(req.accessToken!);

    const { data, error } = await supabase
      .from('tasks')
      .update(result.data)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = createUserClient(req.accessToken!);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
