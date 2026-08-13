// ==========================================
// server/routes/adminRoutes.js
// RangoD TIPS V7 Enterprise
// Admin Routes
// ==========================================

import express from "express";

import {
    protect,
    adminOnly
} from "../middleware/authMiddleware.js";

import {
    getDashboardStats,
    recalculatePremium
} from "../controllers/adminController.js";


const router = express.Router();


// ==========================================
// Admin Dashboard
// GET /api/admin/dashboard
// ==========================================

router.get(
    "/dashboard",
    protect,
    adminOnly,
    getDashboardStats
);


// ==========================================
// Recalculate Premium Predictions
// POST /api/admin/recalculate-premium
// ==========================================

router.post(
    "/recalculate-premium",
    protect,
    adminOnly,
    recalculatePremium
);


export default router;