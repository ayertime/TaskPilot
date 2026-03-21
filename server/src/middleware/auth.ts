import type { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../services/supabase';

export async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      reply.code(401).send({ error: 'Invalid or expired token' });
      return;
    }

    (req as any).userId = data.user.id;
    (req as any).userEmail = data.user.email;
    (req as any).accessToken = token;
  } catch {
    reply.code(500).send({ error: 'Authentication failed' });
  }
}
