import express from "express";
import { getCompetitions } from "../controllers/competitionController.js";

const router = express.Router();

/**
 * @route   GET /api/competitions
 * @desc    Get all competitions with match & prediction counts
 * @access  Public
 */
router.get("/", getCompetitions);

export default router;