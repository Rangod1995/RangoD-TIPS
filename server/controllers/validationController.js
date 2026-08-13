import { validatePredictions } from "../services/validationService.js";

/**
 * Run validation for all completed, unvalidated predictions.
 */
export async function runValidation(req, res) {
  try {
    const results = await validatePredictions();

    res.status(200).json({
      success: true,
      message: "Prediction validation completed successfully.",
      validated: results?.updated ?? results?.checked ?? 0,
      results,
    });
  } catch (error) {
    console.error("Validation Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to validate predictions.",
      error: error.message,
    });
  }
}
