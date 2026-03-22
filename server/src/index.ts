import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks';
import categoryRoutes from './routes/categories';
import profileRoutes from './routes/profile';
import chatRoutes from './routes/chat';
import activityRoutes from './routes/activity';
import { startScheduler } from './services/scheduler';

dotenv.config();

const app = Fastify({ logger: true });
const PORT = Number(process.env.PORT) || 3001;

async function start() {
  // CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Health check
  app.get('/api/health', async () => {
    return { status: 'ok', name: 'TaskPilot API', version: '1.0.0' };
  });

  // Routes
  await app.register(taskRoutes, { prefix: '/api/tasks' });
  await app.register(categoryRoutes, { prefix: '/api/categories' });
  await app.register(profileRoutes, { prefix: '/api/profile' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(activityRoutes, { prefix: '/api/activity' });

  // Start server
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`TaskPilot API running on http://localhost:${PORT}`);

  // Start proactive agent scheduler
  startScheduler();
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
