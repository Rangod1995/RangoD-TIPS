// ==========================================
// server/controllers/adminController.js
// RangoD TIPS V7 Enterprise
// Admin Controller
// ==========================================

import Prediction from "../models/Prediction.js";
import User from "../models/User.js";

import {
    recalculatePremiumPredictions
} from "../services/predictionService.js";


// ==========================================
// Get Admin Dashboard Statistics
// ==========================================

export async function getDashboardStats(req, res) {
    try {

        const start = new Date();

        start.setHours(
            0,
            0,
            0,
            0
        );


        const end = new Date(start);

        end.setDate(
            end.getDate() + 1
        );


        const [
            totalPredictions,
            todayPredictions,
            premiumPredictions,
            totalUsers,
            recentPredictions
        ] = await Promise.all([

            Prediction.countDocuments(),

            Prediction.countDocuments({
                matchDate: {
                    $gte: start,
                    $lt: end
                }
            }),

            Prediction.countDocuments({
                isPremium: true
            }),

            User.countDocuments(),

            Prediction.find()
                .sort({
                    createdAt: -1
                })
                .limit(10)
                .lean()

        ]);


        return res.status(200).json({

            success: true,

            stats: {

                totalPredictions,

                todayPredictions,

                premiumPredictions,

                totalUsers

            },

            recentPredictions

        });

    } catch (error) {

        console.error(
            "Dashboard Stats Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load dashboard statistics.",

            error:
                error.message

        });

    }
}


// ==========================================
// Recalculate Premium Predictions
// ==========================================
//
// POST
// /api/admin/recalculate-premium
//
// Admin only
// ==========================================

export async function recalculatePremium(
    req,
    res
) {

    try {

        console.log(
            "=========================================="
        );

        console.log(
            "[Admin] Starting premium recalculation..."
        );

        console.log(
            "=========================================="
        );


        const result =
            await recalculatePremiumPredictions();


        console.log(
            "[Admin] Premium recalculation completed."
        );


        return res.status(200).json({

            success: true,

            message:
                "Premium predictions recalculated successfully.",

            result

        });

    } catch (error) {

        console.error(
            "[Admin] Premium recalculation error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to recalculate premium predictions."

        });

    }
}


// ==========================================
// Default Export
// ==========================================

export default {
    getDashboardStats,
    recalculatePremium
};