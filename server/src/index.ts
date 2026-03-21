import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'TaskPilot API', version: '1.0.0' });
});

// Start server
app.listen(PORT, () => {
  console.log(`TaskPilot API running on http://localhost:${PORT}`);
});

export default app;
