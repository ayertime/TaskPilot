import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { createUserClient } from '../services/supabase';
import { supabaseAdmin } from '../services/supabase';
import { runAgent, type SSEEvent } from '../services/ai-agent';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export default async function chatRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // POST /api/chat — Send a message to the AI agent (SSE streaming response)
  app.post('/', async (req, reply) => {
    const userId = (req as any).userId as string;
    const accessToken = (req as any).accessToken as string;

    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: parsed.error.issues[0].message });
      return;
    }

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

    // --- CLAUDE API PAUSED ---
    // AI agent is paused to stop API costs. Will re-enable with local model.
    // Fetch user's name for a personalized greeting
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name, full_name')
      .eq('id', userId)
      .single();

    const name = profile?.display_name || profile?.full_name?.split(' ')[0] || 'there';

    sendSSE({
      type: 'text',
      content: `Hello ${name}! I'm currently taking a short break while we upgrade to a faster, local AI model. I'll be back soon and ready to help you manage your tasks, emails, and calendar. In the meantime, you can still create and organize tasks manually. Thanks for your patience!`,
    });
    sendSSE({ type: 'done' });
    // try {
    //   await runAgent({
    //     userId,
    //     userClient,
    //     userMessage: parsed.data.message,
    //     onEvent: sendSSE,
    //   });
    // } catch (err) {
    //   sendSSE({
    //     type: 'error',
    //     message: err instanceof Error ? err.message : 'Agent failed',
    //   });
    // }

    reply.raw.end();
  });

  // GET /api/chat/history — Get chat history
  app.get('/history', async (req) => {
    const userId = (req as any).userId as string;

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    return { messages: data || [] };
  });

  // DELETE /api/chat/history — Clear chat history
  app.delete('/history', async (req) => {
    const userId = (req as any).userId as string;

    const { error } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, message: 'Chat history cleared' };
  });
}
