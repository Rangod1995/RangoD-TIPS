// ==========================================
// server/routes/subscriptionRoutes.js
// RangoD AI Engine V7 Enterprise
// Subscription Routes
// ==========================================

import express from "express";

import {
  createSubscriptionPayment,
  verifySubscriptionPayment
} from "../controllers/paymentController.js";

import {
  protect
} from "../middleware/authMiddleware.js";


const router =
express.Router();



// ==========================================
// Initialize Subscription Payment
// ==========================================

router.post(
"/initialize",
protect,
createSubscriptionPayment
);



// ==========================================
// Verify Payment
// ==========================================

router.get(
"/verify/:reference",
protect,
verifySubscriptionPayment
);



export default router;