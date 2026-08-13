// ==========================================
// server/controllers/dashboardController.js
// RangoD TIPS
// Dashboard Controller
// ==========================================

import * as dashboardService from "../services/dashboardService.js";

// ==========================================
// GET PROFILE
// ==========================================

export async function getProfile(req, res) {
  try {
    console.log("Dashboard user:", req.user);

    const userId =
      req.user?._id ||
      req.user?.id;

    console.log(
      "Dashboard user ID:",
      userId
    );

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID missing from authentication token",
      });
    }

    const profile =
      await dashboardService.getUserProfile(
        userId
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          "User profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error(
      "Get Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch user profile",
    });
  }
}

// ==========================================
// GET STATS
// ==========================================

export async function getStats(req, res) {
  try {
    const stats =
      await dashboardService.getDashboardStats();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error(
      "Get Dashboard Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard statistics",
    });
  }
}

// ==========================================
// GET RECENT PREDICTIONS
// ==========================================

export async function getRecentPredictions(
  req,
  res
) {
  try {
    const limit =
      parseInt(req.query.limit, 10) || 10;

    if (
      Number.isNaN(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Limit must be a number between 1 and 100",
      });
    }

    const predictions =
      await dashboardService.getRecentPredictions(
        limit
      );

    return res.status(200).json({
      success: true,
      count: predictions.length,
      predictions,
    });
  } catch (error) {
    console.error(
      "Get Recent Predictions Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch recent predictions",
    });
  }
}

// ==========================================
// GET FAVORITES
// ==========================================

export async function getFavorites(req, res) {
  try {
    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID missing from authentication token",
      });
    }

    const favorites =
      await dashboardService.getFavoriteTeams(
        userId
      );

    return res.status(200).json({
      success: true,
      favorites,
    });
  } catch (error) {
    console.error(
      "Get Favorites Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch favorite teams",
    });
  }
}