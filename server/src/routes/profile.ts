import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createUserClient, supabaseAdmin } from '../services/supabase';

const updateProfileSchema = z.object({
  display_name: z.string().min(1).optional(),
  custom_avatar_url: z.string().url().nullable().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  timezone: z.string().optional(),
  sync_enabled: z.boolean().optional(),
  sync_interval: z.enum(['1h', '3h', '5h', '12h', '24h']).optional(),
  has_seen_tutorial: z.boolean().optional(),
  briefing_topics: z.array(z.string()).optional(),
});

const oauthTokensSchema = z.object({
  provider: z.string(),
  provider_token: z.string(),
  provider_refresh_token: z.string().nullable().optional(),
});

export default async function profileRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/profile
  app.get('/', async (req, reply) => {
    try {
      const supabase = createUserClient((req as any).accessToken!);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, full_name, custom_avatar_url, theme, accent_color, timezone, provider, sync_enabled, sync_interval, has_seen_tutorial, briefing_topics, created_at, updated_at')
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

  // GET /api/profile/oauth-status — Check if OAuth tokens are connected
  app.get('/oauth-status', async (req, reply) => {
    try {
      const userId = (req as any).userId as string;
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('provider')
        .not('provider_token', 'is', null)
        .eq('id', userId)
        .single();

      return {
        connected: !!data,
        provider: data?.provider || null,
      };
    } catch {
      reply.code(500).send({ error: 'Failed to check OAuth status' });
    }
  });

  // POST /api/profile/oauth-tokens — Save OAuth tokens from provider
  app.post('/oauth-tokens', async (req, reply) => {
    try {
      const result = oauthTokensSchema.safeParse(req.body);
      if (!result.success) {
        reply.code(400).send({ error: 'Invalid token data' });
        return;
      }

      const userId = (req as any).userId as string;

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          provider: result.data.provider,
          provider_token: result.data.provider_token,
          provider_refresh_token: result.data.provider_refresh_token || null,
        })
        .eq('id', userId);

      if (error) {
        reply.code(400).send({ error: error.message });
        return;
      }

      return { success: true };
    } catch (err) {
      console.error('[OAuth] Exception:', err);
      reply.code(500).send({ error: 'Failed to save OAuth tokens' });
    }
  });

  // DELETE /api/profile/account — Permanently delete user account and all data
  app.delete('/account', async (req, reply) => {
    const userId = (req as any).userId as string;
    try {
      // Delete child tables first (foreign key order)
      await supabaseAdmin.from('email_drafts').delete().eq('user_id', userId);
      await supabaseAdmin.from('chat_messages').delete().eq('user_id', userId);
      await supabaseAdmin.from('agent_activity').delete().eq('user_id', userId);
      await supabaseAdmin.from('tasks').delete().eq('user_id', userId);
      await supabaseAdmin.from('categories').delete().eq('user_id', userId);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);

      // Delete the auth user last
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        reply.code(500).send({ error: 'Failed to delete auth account' });
        return;
      }

      return { success: true };
    } catch (err) {
      console.error('[Account Delete] Error:', err);
      reply.code(500).send({ error: 'Failed to delete account' });
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
        .select('id, email, display_name, full_name, custom_avatar_url, theme, accent_color, timezone, provider, sync_enabled, sync_interval, has_seen_tutorial, briefing_topics, created_at, updated_at')
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
