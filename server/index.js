// ==========================================
// server/index.js
// RangoD TIPS V7 Enterprise
// Main Server Entry
// ==========================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// Database
// ==========================================

import connectDB from "./config/database.js";

// ==========================================
// Routes
// ==========================================

import predictionRoutes from "./routes/predictions.js";
import authRoutes from "./routes/auth.js";
import matchRoutes from "./routes/matches.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/adminRoutes.js";

// ==========================================
// Schedulers
// ==========================================

import {
  startPredictionScheduler,
} from "./jobs/predictionScheduler.js";

import {
  startValidationScheduler,
} from "./jobs/validationScheduler.js";

// ==========================================
// App Setup
// ==========================================

const app = express();

// ==========================================
// Global Middleware
// ==========================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

// ==========================================
// Request Logger
// ==========================================

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// ==========================================
// Database Connection
// ==========================================

connectDB();

// ==========================================
// API ROUTES
// ==========================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Predictions
app.use(
  "/api/predictions",
  predictionRoutes
);

// Matches
app.use(
  "/api/matches",
  matchRoutes
);

// User Dashboard
app.use(
  "/api/dashboard",
  dashboardRoutes
);

// Admin
app.use(
  "/api/admin",
  adminRoutes
);

// ==========================================
// Health Check
// ==========================================

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      name: "RangoD TIPS",
      engine: "RangoD AI Engine V7 Enterprise",
      status: "running",
      timestamp: new Date().toISOString(),
    });
  }
);

// ==========================================
// Root Endpoint
// ==========================================

app.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,
      name: "RangoD TIPS",
      engine: "RangoD AI Engine V7 Enterprise",
      version: "V7",
      status: "running",

      api: {
        health: "/api/health",
        auth: "/api/auth",
        predictions: "/api/predictions",
        matches: "/api/matches",
        dashboard: "/api/dashboard",
        admin: "/api/admin",
        adminDashboard: "/api/admin/dashboard",
      },
    });
  }
);

// ==========================================
// API 404 HANDLER
// ==========================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found.",
      path: req.originalUrl,
      method: req.method,
    });
  }
);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    console.error(
      "=========================================="
    );

    console.error(
      "RangoD API Error"
    );

    console.error(error);

    console.error(
      "=========================================="
    );

    if (res.headersSent) {
      return next(error);
    }

    return res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error.",
    });
  }
);

// ==========================================
// SERVER CONFIGURATION
// ==========================================

const PORT =
  Number(process.env.PORT) || 5000;

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(
  PORT,
  () => {
    console.log(
      "=========================================="
    );

    console.log(
      "🚀 RangoD TIPS Backend"
    );

    console.log(
      "🤖 RangoD AI Engine V7 Enterprise"
    );

    console.log(
      "=========================================="
    );

    console.log(
      `📡 Server: http://localhost:${PORT}`
    );

    console.log(
      `❤️ Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `🔐 Auth: http://localhost:${PORT}/api/auth`
    );

    console.log(
      `⚽ Predictions: http://localhost:${PORT}/api/predictions`
    );

    console.log(
      `⚽ Matches: http://localhost:${PORT}/api/matches`
    );

    console.log(
      `📊 Dashboard: http://localhost:${PORT}/api/dashboard`
    );

    console.log(
      `👑 Admin: http://localhost:${PORT}/api/admin`
    );

    console.log(
      `📈 Admin Dashboard: http://localhost:${PORT}/api/admin/dashboard`
    );

    console.log(
      "=========================================="
    );

    // ========================================
    // Prediction Scheduler
    // ========================================

    try {
      startPredictionScheduler();

      console.log(
        "✅ Prediction scheduler started"
      );
    } catch (error) {
      console.error(
        "❌ Prediction scheduler failed:",
        error.message
      );
    }

    // ========================================
    // Validation Scheduler
    // ========================================

    try {
      startValidationScheduler();

      console.log(
        "✅ Validation scheduler started"
      );
    } catch (error) {
      console.error(
        "❌ Validation scheduler failed:",
        error.message
      );
    }

    console.log(
      "=========================================="
    );
  }
);

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

function gracefulShutdown(signal) {
  console.log(
    `\n${signal} received. Shutting down RangoD TIPS...`
  );

  server.close(() => {
    console.log(
      "✅ HTTP server closed."
    );

    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "⚠️ Forced shutdown after timeout."
    );

    process.exit(1);
  }, 10000);
}

// ==========================================
// Shutdown Signals
// ==========================================

process.on(
  "SIGINT",
  () => gracefulShutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => gracefulShutdown("SIGTERM")
);

// ==========================================
// Unhandled Promise Rejection
// ==========================================

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "❌ Unhandled Promise Rejection:",
      reason
    );
  }
);

// ==========================================
// Uncaught Exception
// ==========================================

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);
// ==========================================
// Unhandled Promise Rejection
// ==========================================

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "=========================================="
    );

    console.error(
      "RangoD Unhandled Promise Rejection"
    );

    console.error(reason);

    console.error(
      "=========================================="
    );
  }
);

// ==========================================
// Uncaught Exception
// ==========================================

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "=========================================="
    );

    console.error(
      "RangoD Uncaught Exception"
    );

    console.error(error);

    console.error(
      "=========================================="
    );

    gracefulShutdown(
      "uncaughtException"
    );
  }
);
