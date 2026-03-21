import { Router, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createUserClient } from '../services/supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware as any);

const createCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().optional().default('folder'),
});

const updateCategorySchema = createCategorySchema.partial();

// GET /api/categories
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = createUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = createCategorySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid category data', details: result.error.issues });
      return;
    }

    const supabase = createUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...result.data, user_id: req.userId })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
  } catch {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/categories/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = updateCategorySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid update data' });
      return;
    }

    const supabase = createUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('categories')
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
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = createUserClient(req.accessToken!);
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
