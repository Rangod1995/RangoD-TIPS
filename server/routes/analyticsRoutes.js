import express from "express";
import {
  overallAnalytics,
  leagueAnalytics,
  marketAnalytics,
  confidenceAnalytics,
  statusAnalytics,
  timeAnalytics,
  dashboardAnalytics,
} from "../controllers/analyticsController.js";

const router = express.Router();

// Dashboard Summary
router.get("/dashboard", dashboardAnalytics);

// Overall Statistics
router.get("/overall", overallAnalytics);

// League Statistics
router.get("/leagues", leagueAnalytics);

// Market Statistics
router.get("/markets", marketAnalytics);

// Confidence Statistics
router.get("/confidence", confidenceAnalytics);

// Prediction Status Statistics
router.get("/status", statusAnalytics);

// Time-based Statistics
router.get("/time", timeAnalytics);

export default router;