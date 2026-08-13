// ==========================================
// server/routes/auth.js
// RangoD TIPS V7 Enterprise
// Authentication Routes
// ==========================================

import express from "express";

import {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    changePassword
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================

router.post(
    "/register",
    register
);


// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

router.post(
    "/login",
    login
);


// ==========================================
// GET CURRENT USER
// GET /api/auth/me
// ==========================================

router.get(
    "/me",
    protect,
    getMe
);


// ==========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ==========================================

router.post(
    "/forgot-password",
    forgotPassword
);


// ==========================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// ==========================================

router.post(
    "/reset-password/:token",
    resetPassword
);


// ==========================================
// CHANGE PASSWORD
// POST /api/auth/change-password
// ==========================================

router.post(
    "/change-password",
    protect,
    changePassword
);


// ==========================================
// DEFAULT EXPORT
// ==========================================

export default router;