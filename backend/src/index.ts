import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import analyticsRoutes from "./routes/analytics.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Auto-seed default admin if database is empty
const seedAdmin = async () => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const bcrypt = require("bcryptjs");
    const prisma = new PrismaClient();
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount === 0) {
      console.log("No ADMIN found. Seeding default admin account...");
      const passwordHash = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          name: "System Admin",
          email: "admin@plenitude.com",
          passwordHash,
          role: "ADMIN",
        },
      });
      console.log("Default admin seeded: admin@plenitude.com / admin123");
    }

    const ruleCount = await prisma.drawdownRule.count();
    if (ruleCount === 0) {
      console.log("No Drawdown Rules found. Seeding default strategy rules...");
      await prisma.drawdownRule.createMany({
        data: [
          {
            step: 1,
            minDrawdown: 0.0,
            maxDrawdown: 0.49,
            equityAllocation: 10.0,
            debtAllocation: 90.0,
          },
          {
            step: 2,
            minDrawdown: 0.5,
            maxDrawdown: 0.99,
            equityAllocation: 10.6,
            debtAllocation: 89.4,
          },
          {
            step: 3,
            minDrawdown: 1.0,
            maxDrawdown: 1.49,
            equityAllocation: 11.2,
            debtAllocation: 88.8,
          },
          {
            step: 4,
            minDrawdown: 1.5,
            maxDrawdown: 1.99,
            equityAllocation: 11.8,
            debtAllocation: 88.2,
          },
          {
            step: 5,
            minDrawdown: 2.0,
            maxDrawdown: 2.49,
            equityAllocation: 12.4,
            debtAllocation: 87.6,
          },
          {
            step: 6,
            minDrawdown: 2.5,
            maxDrawdown: 2.99,
            equityAllocation: 13.0,
            debtAllocation: 87.0,
          },
          {
            step: 7,
            minDrawdown: 3.0,
            maxDrawdown: 3.49,
            equityAllocation: 14.2,
            debtAllocation: 85.8,
          },
          {
            step: 8,
            minDrawdown: 3.5,
            maxDrawdown: 3.99,
            equityAllocation: 15.4,
            debtAllocation: 84.6,
          },
          {
            step: 9,
            minDrawdown: 4.0,
            maxDrawdown: 4.49,
            equityAllocation: 16.6,
            debtAllocation: 83.4,
          },
          {
            step: 10,
            minDrawdown: 4.5,
            maxDrawdown: 4.99,
            equityAllocation: 17.8,
            debtAllocation: 82.2,
          },
          {
            step: 11,
            minDrawdown: 5.0,
            maxDrawdown: 5.49,
            equityAllocation: 19.0,
            debtAllocation: 81.0,
          },
          {
            step: 12,
            minDrawdown: 5.5,
            maxDrawdown: 5.99,
            equityAllocation: 21.5,
            debtAllocation: 78.5,
          },
          {
            step: 13,
            minDrawdown: 6.0,
            maxDrawdown: 6.49,
            equityAllocation: 23.9,
            debtAllocation: 76.1,
          },
          {
            step: 14,
            minDrawdown: 6.5,
            maxDrawdown: 6.99,
            equityAllocation: 26.3,
            debtAllocation: 73.7,
          },
          {
            step: 15,
            minDrawdown: 7.0,
            maxDrawdown: 7.49,
            equityAllocation: 28.7,
            debtAllocation: 71.3,
          },
          {
            step: 16,
            minDrawdown: 7.5,
            maxDrawdown: 7.99,
            equityAllocation: 31.1,
            debtAllocation: 68.9,
          },
          {
            step: 17,
            minDrawdown: 8.0,
            maxDrawdown: 8.49,
            equityAllocation: 35.9,
            debtAllocation: 64.1,
          },
          {
            step: 18,
            minDrawdown: 8.5,
            maxDrawdown: 8.99,
            equityAllocation: 40.8,
            debtAllocation: 59.2,
          },
          {
            step: 19,
            minDrawdown: 9.0,
            maxDrawdown: 9.49,
            equityAllocation: 45.6,
            debtAllocation: 54.4,
          },
          {
            step: 20,
            minDrawdown: 9.5,
            maxDrawdown: 9.99,
            equityAllocation: 50.4,
            debtAllocation: 49.6,
          },
          {
            step: 21,
            minDrawdown: 10.0,
            maxDrawdown: 10.49,
            equityAllocation: 55.2,
            debtAllocation: 44.8,
          },
          {
            step: 22,
            minDrawdown: 10.5,
            maxDrawdown: 10.99,
            equityAllocation: 64.9,
            debtAllocation: 35.1,
          },
          {
            step: 23,
            minDrawdown: 11.0,
            maxDrawdown: 11.49,
            equityAllocation: 74.5,
            debtAllocation: 25.5,
          },
          {
            step: 24,
            minDrawdown: 11.5,
            maxDrawdown: 11.99,
            equityAllocation: 84.2,
            debtAllocation: 15.8,
          },
          {
            step: 25,
            minDrawdown: 12.0,
            maxDrawdown: 12.49,
            equityAllocation: 93.8,
            debtAllocation: 6.2,
          },
          {
            step: 26,
            minDrawdown: 12.5,
            maxDrawdown: 12.99,
            equityAllocation: 103.5,
            debtAllocation: -3.5,
          },
          {
            step: 27,
            minDrawdown: 13.0,
            maxDrawdown: 13.49,
            equityAllocation: 122.8,
            debtAllocation: -22.8,
          },
          {
            step: 28,
            minDrawdown: 13.5,
            maxDrawdown: 13.99,
            equityAllocation: 142.1,
            debtAllocation: -42.1,
          },
          {
            step: 29,
            minDrawdown: 14.0,
            maxDrawdown: 14.49,
            equityAllocation: 161.4,
            debtAllocation: -61.4,
          },
          {
            step: 30,
            minDrawdown: 14.5,
            maxDrawdown: 14.99,
            equityAllocation: 180.7,
            debtAllocation: -80.7,
          },
          {
            step: 31,
            minDrawdown: 15.0,
            maxDrawdown: 100,
            equityAllocation: 200.0,
            debtAllocation: -100.0,
          },
        ],
      });
      console.log("Default Drawdown Rules seeded successfully!");
    }
  } catch (err) {
    console.error("Failed to run auto-seed script:", err);
  }
};
seedAdmin();

app.use(cors());
app.use(express.json());

// Apply centralized API routes
app.use("/api", apiRoutes);

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

import { initCronJobs } from "./cron/drawdown.cron";

// Centralized Error Handling Middleware (must be exactly here, after all routes)
app.use(errorHandler);

// Start Background Jobs
initCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
