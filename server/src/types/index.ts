import type { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
  userEmail?: string;
  accessToken?: string;
}
