import express from "express";
import {
  initializeSubscription,
  verifySubscription,
  getMySubscription,
  getPaymentHistory,
} from "../controllers/paymentController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize Paystack payment
router.post(
  "/initialize",
  protect,
  initializeSubscription
);

// Verify Paystack payment
router.post(
  "/verify",
  protect,
  verifySubscription
);

// Get current user's subscription
router.get(
  "/subscription",
  protect,
  getMySubscription
);

router.get(
  "/history",
  protect,
  getPaymentHistory
);

export default router;