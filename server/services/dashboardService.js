
// ==========================================
// server/services/dashboardService.js
// RangoD TIPS
// Dashboard Service
// ==========================================

import Prediction from "../models/Prediction.js";
import User from "../models/User.js";

// ==========================================
// Get Dashboard Statistics
// ==========================================

export async function getDashboardStats() {
  const now = new Date();

  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const [
    totalPredictions,
    freePredictions,
    premiumPredictions,
    completedPredictions,
    pendingPredictions,
    todayPredictions,
    avgConfidenceResult,
    accuracyResult,
  ] = await Promise.all([
    // Total predictions
    Prediction.countDocuments(),

    // Free predictions
    Prediction.countDocuments({
      isPremium: false,
    }),

    // Premium predictions
    Prediction.countDocuments({
      isPremium: true,
    }),

    // Completed predictions
    Prediction.countDocuments({
      result: {
        $in: ["WIN", "LOSS"],
      },
    }),

    // Pending predictions
    Prediction.countDocuments({
      result: "PENDING",
    }),

    // Today's predictions
    Prediction.countDocuments({
      createdAt: {
        $gte: startOfDay,
      },
    }),

    // Average confidence
    Prediction.aggregate([
      {
        $group: {
          _id: null,
          averageConfidence: {
            $avg: "$confidence",
          },
        },
      },
    ]),

    // Accuracy
    Prediction.aggregate([
      {
        $match: {
          result: {
            $in: ["WIN", "LOSS"],
          },
        },
      },
      {
        $group: {
          _id: null,

          wins: {
            $sum: {
              $cond: [
                {
                  $eq: ["$result", "WIN"],
                },
                1,
                0,
              ],
            },
          },

          total: {
            $sum: 1,
          },
        },
      },
    ]),
  ]);

  const averageConfidence =
    avgConfidenceResult.length > 0
      ? Math.round(
          avgConfidenceResult[0]
            .averageConfidence || 0
        )
      : 0;

  let accuracy = 0;

  if (
    accuracyResult.length > 0 &&
    accuracyResult[0].total > 0
  ) {
    accuracy = Math.round(
      (accuracyResult[0].wins /
        accuracyResult[0].total) *
        100
    );
  }

  return {
    totalPredictions,
    freePredictions,
    premiumPredictions,
    averageConfidence,
    accuracy,
    todayPredictions,
    completedPredictions,
    pendingPredictions,
  };
}

// ==========================================
// Get Recent Predictions
// ==========================================

export async function getRecentPredictions(
  limit = 10
) {
  return await Prediction.find()
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .select({
      fixtureId: 1,
      league: 1,
      homeTeam: 1,
      awayTeam: 1,
      prediction: 1,
      confidence: 1,
      isPremium: 1,
      result: 1,
      status: 1,
      createdAt: 1,
    })
    .lean();
}

// ==========================================
// Get Favorite Teams
// ==========================================

export async function getFavoriteTeams(userId) {
  const user = await User.findById(userId).select(
    "favorites"
  );

  if (!user) {
    return [];
  }

  if (
    !user.favorites ||
    user.favorites.length === 0
  ) {
    return [];
  }

  return user.favorites;
}

// ==========================================
// Get User Profile
// ==========================================

export async function getUserProfile(userId) {
  const user = await User.findById(userId).select(
    "name email subscription avatar createdAt"
  );

  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    subscription: user.subscription,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

