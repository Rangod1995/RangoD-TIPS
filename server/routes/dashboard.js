// ==========================================
// server/routes/dashboard.js
// RangoD TIPS
// Dashboard Routes
// ==========================================

import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  getProfile,
  getStats,
  getRecentPredictions,
  getFavorites,
} from "../controllers/dashboardController.js";

const router = express.Router();

// ==========================================
// Dashboard Profile
// ==========================================

router.get(
  "/profile",
  protect,
  getProfile
);

// ==========================================
// Dashboard Statistics
// ==========================================

router.get(
  "/stats",
  protect,
  getStats
);

// ==========================================
// Recent Predictions
// ==========================================

router.get(
  "/recent-predictions",
  protect,
  getRecentPredictions
);

// ==========================================
// Favorite Teams
// ==========================================

router.get(
  "/favorites",
  protect,
  getFavorites
);

export default router;