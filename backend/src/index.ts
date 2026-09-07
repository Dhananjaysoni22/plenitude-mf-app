import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Apply centralized API routes
app.use('/api', apiRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

import { initCronJobs } from './cron/drawdown.cron';

// Centralized Error Handling Middleware (must be exactly here, after all routes)
app.use(errorHandler);

// Start Background Jobs
initCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
