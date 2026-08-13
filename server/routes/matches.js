import express from "express";
import {
  getMatches,
  getLiveMatches,
} from "../controllers/matchController.js";

const router = express.Router();

router.get("/", getMatches);
router.get("/live", getLiveMatches);

export default router;