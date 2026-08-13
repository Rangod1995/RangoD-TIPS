// ==========================================
// server/controllers/predictionController.js
// RangoD TIPS V7 Enterprise
// ==========================================

import {
    getAllPredictions,
    getPredictionById,
    getPredictionByFixtureId,
    createPrediction,
    generateDailyPredictions,
    updatePrediction,
    deletePrediction
} from "../services/predictionService.js";

// ==========================================
// GET ALL
// ==========================================

export async function getPredictions(
    req,
    res
) {
    try {

        const result =
            await getAllPredictions(
                req.query || {}
            );

        const predictions =
            Array.isArray(result)
                ? result
                : Array.isArray(result?.predictions)
                    ? result.predictions
                    : Array.isArray(result?.data)
                        ? result.data
                        : [];

        const total =
            Number(
                result?.total ??
                predictions.length
            );

        const page =
            Number(
                req.query?.page
            ) > 0
                ? Number(
                    req.query.page
                )
                : 1;

        const limit =
            Number(
                req.query?.limit
            ) > 0
                ? Number(
                    req.query.limit
                )
                : 12;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total / limit
                )
            );

        return res.status(200).json({
            success: true,

            count:
                predictions.length,

            data:
                predictions,

            predictions,

            total,

            page,

            totalPages
        });

    } catch (error) {

        console.error(
            "[PredictionController] getPredictions:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to load predictions.",
            count: 0,
            data: [],
            predictions: [],
            total: 0,
            page: 1,
            totalPages: 1
        });
    }
}

// ==========================================
// GET SINGLE
// ==========================================

export async function getPrediction(
    req,
    res
) {
    try {

        const id =
            String(
                req.params.id ||
                ""
            ).trim();

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Prediction ID is required."
            });
        }

        let prediction = null;

        if (
            /^\d+$/.test(id)
        ) {

            prediction =
                await getPredictionByFixtureId(
                    Number(id)
                );
        }

        if (!prediction) {

            prediction =
                await getPredictionById(
                    id
                );
        }

        if (!prediction) {

            return res.status(404).json({
                success: false,
                message:
                    "Prediction not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: prediction,
            prediction
        });

    } catch (error) {

        console.error(
            "[PredictionController] getPrediction:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to load prediction."
        });
    }
}

// ==========================================
// GET BY FIXTURE
// ==========================================

export async function getPredictionByFixture(
    req,
    res
) {
    try {

        const fixtureId =
            Number(
                req.params.fixtureId
            );

        if (
            !Number.isInteger(
                fixtureId
            ) ||
            fixtureId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "A valid fixture ID is required."
            });
        }

        const prediction =
            await getPredictionByFixtureId(
                fixtureId
            );

        if (!prediction) {

            return res.status(404).json({
                success: false,
                message:
                    "Prediction not found for this fixture.",
                fixtureId
            });
        }

        return res.status(200).json({
            success: true,
            data: prediction,
            prediction
        });

    } catch (error) {

        console.error(
            "[PredictionController] getPredictionByFixture:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to load prediction."
        });
    }
}

// ==========================================
// GENERATE
// ==========================================

export async function generatePredictions(
    req,
    res
) {
    try {

        console.log(
            "[PredictionController] Daily generation START"
        );

        const result =
            await generateDailyPredictions();

        const predictions =
            Array.isArray(result)
                ? result
                : [];

        console.log(
            `[PredictionController] Generated ${predictions.length} predictions`
        );

        return res.status(200).json({
            success: true,
            count:
                predictions.length,
            data:
                predictions,
            predictions
        });

    } catch (error) {

        console.error(
            "[PredictionController] generatePredictions:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate predictions.",
            count: 0,
            data: [],
            predictions: []
        });
    }
}

// ==========================================
// CREATE
// ==========================================

export async function createNewPrediction(
    req,
    res
) {
    try {

        if (
            !req.body ||
            typeof req.body !==
                "object"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Prediction data is required."
            });
        }

        const prediction =
            await createPrediction(
                req.body
            );

        return res.status(201).json({
            success: true,
            data: prediction,
            prediction
        });

    } catch (error) {

        console.error(
            "[PredictionController] createPrediction:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to create prediction."
        });
    }
}

// ==========================================
// UPDATE
// ==========================================

export async function editPrediction(
    req,
    res
) {
    try {

        const id =
            String(
                req.params.id ||
                ""
            ).trim();

        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "Prediction ID is required."
            });
        }

        const prediction =
            await updatePrediction(
                id,
                req.body || {}
            );

        if (!prediction) {

            return res.status(404).json({
                success: false,
                message:
                    "Prediction not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: prediction,
            prediction
        });

    } catch (error) {

        console.error(
            "[PredictionController] updatePrediction:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to update prediction."
        });
    }
}

// ==========================================
// DELETE
// ==========================================

export async function removePrediction(
    req,
    res
) {
    try {

        const id =
            String(
                req.params.id ||
                ""
            ).trim();

        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "Prediction ID is required."
            });
        }

        const deleted =
            await deletePrediction(
                id
            );

        if (!deleted) {

            return res.status(404).json({
                success: false,
                message:
                    "Prediction not found"
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Prediction deleted successfully."
        });

    } catch (error) {

        console.error(
            "[PredictionController] deletePrediction:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to delete prediction."
        });
    }
}

// ==========================================
// DEFAULT
// ==========================================

export default {
    getPredictions,
    getPrediction,
    getPredictionByFixture,
    generatePredictions,
    createNewPrediction,
    editPrediction,
    removePrediction
};