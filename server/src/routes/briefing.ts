import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { createUserClient, supabaseAdmin } from '../services/supabase';
import { runAgent, type SSEEvent } from '../services/ai-agent';

export default async function briefingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // GET /api/briefing/today — Check if today's briefing exists, return it
  app.get('/today', async (req) => {
    const userId = (req as any).userId as string;

    // Check if we already generated a briefing today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: activity } = await supabaseAdmin
      .from('agent_activity')
      .select('created_at')
      .eq('user_id', userId)
      .eq('action_type', 'morning_briefing')
      .gte('created_at', todayStart.toISOString())
      .limit(1);

    if (activity && activity.length > 0) {
      // Briefing was generated today — find the chat message
      const { data: messages } = await supabaseAdmin
        .from('chat_messages')
        .select('content, created_at')
        .eq('user_id', userId)
        .eq('role', 'assistant')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Find the message that looks like a briefing (contains greeting + sections)
      const briefingMsg = messages?.find(
        (m) =>
          m.content.toLowerCase().includes('good morning') ||
          m.content.toLowerCase().includes('briefing') ||
          m.content.toLowerCase().includes('day at a glance'),
      );

      if (briefingMsg) {
        return { exists: true, content: briefingMsg.content, created_at: briefingMsg.created_at };
      }
    }

    return { exists: false, content: null };
  });

  // POST /api/briefing/generate — Generate today's briefing via the agent (SSE)
  app.post('/generate', async (req, reply) => {
    const userId = (req as any).userId as string;
    const accessToken = (req as any).accessToken as string;
    const userClient = createUserClient(accessToken);

    // Set up SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': process.env.CLIENT_URL || 'http://localhost:5173',
      'Access-Control-Allow-Credentials': 'true',
    });

    function sendSSE(event: SSEEvent) {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    try {
      await runAgent({
        userId,
        userClient,
        userMessage:
          'Good morning! Please generate my personalized morning briefing. Use the generate_morning_briefing tool to get my tasks, calendar, overnight activity, and news topics. Present everything in a clean format.',
        onEvent: sendSSE,
      });
    } catch (err) {
      sendSSE({
        type: 'error',
        message: err instanceof Error ? err.message : 'Briefing generation failed',
      });
    }

    reply.raw.end();
  });
}
