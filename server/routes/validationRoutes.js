import express from "express";
import { runValidation } from "../controllers/validationController.js";

const router = express.Router();

/**
 * Run prediction validation manually
 * POST /api/validation/run
 */
router.post("/run", runValidation);

export default router;