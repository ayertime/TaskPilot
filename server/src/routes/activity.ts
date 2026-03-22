import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';

export default async function activityRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/activity — Get agent activity log
  app.get('/', async (req) => {
    const userId = (req as any).userId as string;
    const query = req.query as Record<string, string>;
    const limit = parseInt(query.limit || '50', 10);

    const { data, error } = await supabaseAdmin
      .from('agent_activity')
      .select('*, tasks(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { activities: data || [] };
  });

  // GET /api/activity/summary — Get today's activity summary
  app.get('/summary', async (req) => {
    const userId = (req as any).userId as string;
    const today = new Date().toISOString().split('T')[0];
    const dayStart = `${today}T00:00:00Z`;
    const dayEnd = `${today}T23:59:59Z`;

    const { data, error } = await supabaseAdmin
      .from('agent_activity')
      .select('action_type, description, result, created_at')
      .eq('user_id', userId)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const summary = {
      date: today,
      total_actions: data?.length || 0,
      actions: data || [],
      breakdown: {} as Record<string, number>,
    };

    for (const action of data || []) {
      summary.breakdown[action.action_type] =
        (summary.breakdown[action.action_type] || 0) + 1;
    }

    return summary;
  });
}
