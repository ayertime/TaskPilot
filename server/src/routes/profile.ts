import { Router, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createUserClient } from '../services/supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authMiddleware as any);

const updateProfileSchema = z.object({
  display_name: z.string().min(1).optional(),
  custom_avatar_url: z.string().nullable().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accent_color: z.string().optional(),
  timezone: z.string().optional(),
});

// GET /api/profile
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = createUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.userId!)
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/profile
router.patch('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid profile data', details: result.error.issues });
      return;
    }

    const supabase = createUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('profiles')
      .update(result.data)
      .eq('id', req.userId!)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
