import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createUserClient, supabaseAdmin } from '../services/supabase';

const updateProfileSchema = z.object({
  display_name: z.string().min(1).optional(),
  custom_avatar_url: z.string().nullable().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accent_color: z.string().optional(),
  timezone: z.string().optional(),
  sync_enabled: z.boolean().optional(),
  sync_interval: z.enum(['1h', '3h', '5h', '12h', '24h']).optional(),
  has_seen_tutorial: z.boolean().optional(),
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

  // GET /api/profile/oauth-status — Check if OAuth tokens are connected
  app.get('/oauth-status', async (req, reply) => {
    try {
      const userId = (req as any).userId as string;
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('provider, provider_token')
        .eq('id', userId)
        .single();

      return {
        connected: !!data?.provider_token,
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
        console.log('[OAuth] Invalid token data:', result.error.issues);
        reply.code(400).send({ error: 'Invalid token data' });
        return;
      }

      const userId = (req as any).userId as string;
      console.log('[OAuth] Saving tokens for user:', userId, 'provider:', result.data.provider);

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          provider: result.data.provider,
          provider_token: result.data.provider_token,
          provider_refresh_token: result.data.provider_refresh_token || null,
        })
        .eq('id', userId);

      if (error) {
        console.log('[OAuth] Supabase error:', error.message);
        reply.code(400).send({ error: error.message });
        return;
      }

      console.log('[OAuth] Tokens saved successfully');
      return { success: true };
    } catch (err) {
      console.error('[OAuth] Exception:', err);
      reply.code(500).send({ error: 'Failed to save OAuth tokens' });
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
