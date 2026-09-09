import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Auto-seed default admin if database is empty
const seedAdmin = async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
      console.log('No ADMIN found. Seeding default admin account...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'System Admin',
          email: 'admin@plenitude.com',
          passwordHash,
          role: 'ADMIN'
        }
      });
      console.log('Default admin seeded: admin@plenitude.com / admin123');
    }
  } catch (err) {
    console.error('Failed to run auto-seed script:', err);
  }
};
seedAdmin();

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
