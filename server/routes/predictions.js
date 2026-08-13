
// ==========================================
// server/routes/predictions.js
// RangoD AI Engine V7 Enterprise
// Prediction Routes
// ==========================================

import express from "express";

import {
    getPredictions,
    getPrediction,
    getPredictionByFixture,
    generatePredictions,
    createNewPrediction,
    editPrediction,
    removePrediction
} from "../controllers/predictionController.js";

const router = express.Router();

// ==========================================
// Get All Predictions
// ==========================================

router.get(
    "/",
    getPredictions
);

// ==========================================
// Generate Daily Predictions
// IMPORTANT:
// Keep this BEFORE /:id
// ==========================================

router.post(
    "/generate",
    generatePredictions
);

// ==========================================
// Get Prediction By Fixture ID
// IMPORTANT:
// Keep this BEFORE /:id
// ==========================================

router.get(
    "/fixture/:fixtureId",
    getPredictionByFixture
);

// ==========================================
// Create Prediction
// ==========================================

router.post(
    "/",
    createNewPrediction
);

// ==========================================
// Get Single Prediction
// ==========================================

router.get(
    "/:id",
    getPrediction
);

// ==========================================
// Update Prediction
// ==========================================

router.put(
    "/:id",
    editPrediction
);

// ==========================================
// Delete Prediction
// ==========================================

router.delete(
    "/:id",
    removePrediction
);

export default router;

