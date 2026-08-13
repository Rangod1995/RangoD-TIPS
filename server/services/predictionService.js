// ==========================================
// server/services/predictionService.js
// RangoD TIPS V7 Enterprise
// Prediction Service
// ==========================================

import Prediction from "../models/Prediction.js";

import {
    generatePrediction
} from "./predictionEngine.js";

import {
    getTodayMatches
} from "./footballService.js";

// ==========================================
// HELPERS
// ==========================================

function safeNumber(
    value,
    fallback = 0
) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function clamp(
    value,
    min = 0,
    max = 100
) {
    return Math.max(
        min,
        Math.min(
            max,
            safeNumber(value, min)
        )
    );
}

function isValidObjectId(
    id
) {
    return (
        typeof id === "string" &&
        /^[0-9a-fA-F]{24}$/.test(
            id.trim()
        )
    );
}

function normalizeFixture(
    fixture
) {
    if (!fixture) {
        throw new Error(
            "Invalid fixture."
        );
    }

    const fixtureId =
        safeNumber(
            fixture.fixtureId ??
            fixture.fixture?.id ??
            fixture.id,
            NaN
        );

    if (
        !Number.isFinite(fixtureId) ||
        fixtureId <= 0
    ) {
        throw new Error(
            "Invalid fixture ID."
        );
    }

    return {
        fixtureId,

        homeTeam:
            fixture.homeTeam ??
            fixture.teams?.home?.name ??
            "Unknown",

        awayTeam:
            fixture.awayTeam ??
            fixture.teams?.away?.name ??
            "Unknown",

        league:
            fixture.league?.name ??
            fixture.league ??
            "Unknown",

        matchDate:
            fixture.matchDate ??
            fixture.fixture?.date ??
            new Date(),

        homeTeamId:
            fixture.homeTeamId ??
            fixture.teams?.home?.id,

        awayTeamId:
            fixture.awayTeamId ??
            fixture.teams?.away?.id,

        leagueId:
            fixture.leagueId ??
            fixture.league?.id
    };
}

// ==========================================
// NORMALIZE ENGINE RESULT
// ==========================================

function normalizeEngineResult(
    result
) {
    const prediction =
        result?.prediction &&
        typeof result.prediction === "object"
            ? {
                ...result.prediction
            }
            : {};

    const confidenceSource =
        result?.confidence;

    let confidence = {
        confidence: 65,
        label: "Medium",
        risk: "Medium",
        breakdown: {}
    };

    if (
        confidenceSource &&
        typeof confidenceSource === "object"
    ) {
        confidence = {
            confidence:
                clamp(
                    confidenceSource.confidence ??
                    confidenceSource.score ??
                    confidenceSource.value,
                    65
                ),

            label:
                confidenceSource.label ??
                "Medium",

            risk:
                confidenceSource.risk ??
                "Medium",

            breakdown:
                confidenceSource.breakdown &&
                typeof confidenceSource.breakdown === "object"
                    ? confidenceSource.breakdown
                    : {}
        };
    } else {
        confidence.confidence =
            clamp(
                confidenceSource,
                65
            );
    }

    if (
        !prediction.expectedScore &&
        prediction.score
    ) {
        prediction.expectedScore = {
            expectedHome:
                safeNumber(
                    prediction.score.home
                ),

            expectedAway:
                safeNumber(
                    prediction.score.away
                )
        };
    }

    if (
        !prediction.expectedScore
    ) {
        prediction.expectedScore = {
            expectedHome: 0,
            expectedAway: 0
        };
    }

    if (
        !prediction.probabilities ||
        typeof prediction.probabilities !== "object"
    ) {
        prediction.probabilities = {};
    }

    if (
        !Array.isArray(
            prediction.alternativeMarkets
        )
    ) {
        prediction.alternativeMarkets = [];
    }

    return {
        prediction,

        confidence,

        intelligence:
            result?.intelligence ??
            result?.analysis ??
            {},

        validation:
            result?.validation ??
            {},

        features:
            result?.features ??
            {},

        status:
            result?.status ??
            "pending",

        premiumScore:
            safeNumber(
                result?.premiumScore,
                0
            ),

        premiumCriteria:
            result?.premiumCriteria ??
            {}
    };
}

// ==========================================
// PREMIUM SCORE CALCULATION
// ==========================================
//
// Calculates a consistent premium score from
// already-generated prediction intelligence.
//
// This does NOT generate a new prediction.
// It ranks the predictions already stored in DB.
// ==========================================

function calculatePremiumScore(
    prediction
) {
    const confidence =
        clamp(
            prediction?.confidence?.confidence ??
            prediction?.confidence ??
            0
        );

    const validation =
        prediction?.validation &&
        typeof prediction.validation === "object"
            ? prediction.validation
            : {};

    const qualityScore =
        clamp(
            validation.qualityScore ??
            validation.score ??
            0
        );

    const predictionData =
        prediction?.prediction &&
        typeof prediction.prediction === "object"
            ? prediction.prediction
            : {};

    const probabilities =
        predictionData.probabilities &&
        typeof predictionData.probabilities === "object"
            ? predictionData.probabilities
            : {};

    // --------------------------------------
    // Find strongest probability
    // --------------------------------------

    const probabilityValues = Object.values(
        probabilities
    )
        .map(value => {
            if (
                value &&
                typeof value === "object"
            ) {
                return safeNumber(
                    value.probability ??
                    value.confidence ??
                    value.value,
                    NaN
                );
            }

            return safeNumber(
                value,
                NaN
            );
        })
        .filter(
            value =>
                Number.isFinite(value)
        );

    let strongestProbability = 0;

    if (
        probabilityValues.length > 0
    ) {
        strongestProbability =
            Math.max(
                ...probabilityValues
            );

        // Convert decimal probabilities
        // such as 0.72 into percentages.
        if (
            strongestProbability > 0 &&
            strongestProbability <= 1
        ) {
            strongestProbability *= 100;
        }
    }

    strongestProbability =
        clamp(
            strongestProbability
        );

    // --------------------------------------
    // Validation component
    // --------------------------------------

    const validationComponent =
        qualityScore;

    // --------------------------------------
    // Confidence component
    // --------------------------------------

    const confidenceComponent =
        confidence;

    // --------------------------------------
    // Probability component
    // --------------------------------------

    const probabilityComponent =
        strongestProbability;

    // --------------------------------------
    // Base score
    // --------------------------------------
    //
    // Confidence       40%
    // Validation       30%
    // Probability      30%
    //
    // --------------------------------------

    let score =
        (
            confidenceComponent * 0.40
        ) +
        (
            validationComponent * 0.30
        ) +
        (
            probabilityComponent * 0.30
        );

    // --------------------------------------
    // Risk adjustment
    // --------------------------------------

    const risk =
        String(
            prediction?.confidence?.risk ??
            ""
        ).toLowerCase();

    if (risk === "high") {
        score -= 8;
    } else if (risk === "medium") {
        score -= 2;
    } else if (risk === "low") {
        score += 3;
    }

    // --------------------------------------
    // Validation warnings adjustment
    // --------------------------------------

    const warnings =
        Array.isArray(
            validation.warnings
        )
            ? validation.warnings.length
            : 0;

    score -= Math.min(
        10,
        warnings * 2
    );

    return Math.round(
        clamp(score)
    );
}

// ==========================================
// PREMIUM CRITERIA
// ==========================================

function buildPremiumCriteria(
    prediction,
    premiumScore
) {
    const confidence =
        clamp(
            prediction?.confidence?.confidence ??
            prediction?.confidence ??
            0
        );

    const validation =
        prediction?.validation &&
        typeof prediction.validation === "object"
            ? prediction.validation
            : {};

    const qualityScore =
        clamp(
            validation.qualityScore ??
            validation.score ??
            0
        );

    const risk =
        prediction?.confidence?.risk ??
        "Unknown";

    const warnings =
        Array.isArray(
            validation.warnings
        )
            ? validation.warnings.length
            : 0;

    return {
        premiumScore,

        confidence,

        qualityScore,

        risk,

        validationWarnings:
            warnings,

        confidenceQualified:
            confidence >= 70,

        qualityQualified:
            qualityScore >= 70,

        riskQualified:
            String(risk).toLowerCase() !== "high",

        scoreQualified:
            premiumScore >= 70,

        premiumQualified:
            premiumScore >= 70 &&
            confidence >= 70 &&
            qualityScore >= 70 &&
            String(risk).toLowerCase() !== "high",

        calculatedAt:
            new Date()
    };
}

// ==========================================
// GET ALL PREDICTIONS
// ==========================================

export async function getAllPredictions(
    filters = {}
) {
    const query = {};

    // --------------------------------------
    // Search
    // --------------------------------------

    if (filters.search) {
        const search =
            String(
                filters.search
            ).trim();

        if (search) {
            query.$or = [
                {
                    homeTeam: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    awayTeam: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    league: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }
    }

    // --------------------------------------
    // League
    // --------------------------------------

    if (filters.league) {
        query.league = {
            $regex:
                String(
                    filters.league
                ),
            $options: "i"
        };
    }

    // --------------------------------------
    // Premium
    // --------------------------------------

    if (
        filters.isPremium !== undefined &&
        filters.isPremium !== null &&
        filters.isPremium !== ""
    ) {
        query.isPremium =
            filters.isPremium === true ||
            filters.isPremium === "true";
    }

    // --------------------------------------
    // Date
    // --------------------------------------

    if (filters.date) {
        const start =
            new Date(
                `${filters.date}T00:00:00.000Z`
            );

        const end =
            new Date(
                `${filters.date}T23:59:59.999Z`
            );

        if (
            !Number.isNaN(
                start.getTime()
            ) &&
            !Number.isNaN(
                end.getTime()
            )
        ) {
            query.matchDate = {
                $gte: start,
                $lte: end
            };
        }
    }

    // --------------------------------------
    // Pagination
    // --------------------------------------

    const page =
        Math.max(
            1,
            safeNumber(
                filters.page,
                1
            )
        );

    const limit =
        Math.min(
            200,
            Math.max(
                1,
                safeNumber(
                    filters.limit,
                    12
                )
            )
        );

    const skip =
        (page - 1) *
        limit;

    // --------------------------------------
    // Sort
    // --------------------------------------

    let sortField =
        "createdAt";

    if (
        filters.sortBy ===
        "matchDate"
    ) {
        sortField =
            "matchDate";
    }

    if (
        filters.sortBy ===
        "confidence"
    ) {
        sortField =
            "confidence.confidence";
    }

    if (
        filters.sortBy ===
        "premiumScore"
    ) {
        sortField =
            "premiumScore";
    }

    const sortDirection =
        String(
            filters.sortOrder
        ).toLowerCase() === "asc"
            ? 1
            : -1;

    const sort = {
        [sortField]:
            sortDirection
    };

    // --------------------------------------
    // Database
    // --------------------------------------

    const [
        predictions,
        total
    ] = await Promise.all([
        Prediction
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),

        Prediction
            .countDocuments(query)
    ]);

    return {
        predictions:
            Array.isArray(
                predictions
            )
                ? predictions
                : [],

        total,

        page,

        limit,

        totalPages:
            Math.max(
                1,
                Math.ceil(
                    total / limit
                )
            )
    };
}

// ==========================================
// GET BY ID
// ==========================================

export async function getPredictionById(
    id
) {
    if (!id) {
        return null;
    }

    const normalized =
        String(id).trim();

    if (
        isValidObjectId(
            normalized
        )
    ) {
        const prediction =
            await Prediction
                .findById(
                    normalized
                )
                .lean();

        if (prediction) {
            return prediction;
        }
    }

    const fixtureId =
        safeNumber(
            normalized,
            NaN
        );

    if (
        Number.isFinite(
            fixtureId
        ) &&
        fixtureId > 0
    ) {
        return Prediction
            .findOne({
                fixtureId
            })
            .lean();
    }

    return null;
}

// ==========================================
// GET BY FIXTURE ID
// ==========================================

export async function getPredictionByFixtureId(
    fixtureId
) {
    const id =
        safeNumber(
            fixtureId,
            NaN
        );

    if (
        !Number.isFinite(id) ||
        id <= 0
    ) {
        return null;
    }

    return Prediction
        .findOne({
            fixtureId: id
        })
        .lean();
}

// ==========================================
// CREATE / UPDATE
// ==========================================

export async function createPrediction(
    fixture
) {
    const normalized =
        normalizeFixture(
            fixture
        );

    console.log(
        `[PredictionService] Processing fixture ${normalized.fixtureId}`
    );

    const engineResult =
        await generatePrediction(
            normalized
        );

    if (!engineResult) {
        throw new Error(
            `Prediction engine returned no result for fixture ${normalized.fixtureId}`
        );
    }

    const result =
        normalizeEngineResult(
            engineResult
        );

    const document = {
        fixtureId:
            normalized.fixtureId,

        homeTeam:
            normalized.homeTeam,

        awayTeam:
            normalized.awayTeam,

        league:
            normalized.league,

        matchDate:
            normalized.matchDate,

        prediction:
            result.prediction,

        confidence:
            result.confidence,

        intelligence:
            result.intelligence,

        validation:
            result.validation,

        features:
            result.features,

        status:
            result.status,

        isPremium:
            false,

        premiumScore:
            result.premiumScore,

        premiumCriteria:
            result.premiumCriteria,

        premiumRank:
            null,

        dailyPremiumScore:
            null
    };

    const existing =
        await Prediction
            .findOne({
                fixtureId:
                    normalized.fixtureId
            });

    if (existing) {
        Object.assign(
            existing,
            document
        );

        await existing.save();

        return existing.toObject();
    }

    try {
        const created =
            await Prediction.create(
                document
            );

        return created.toObject();

    } catch (error) {

        if (
            error?.code === 11000
        ) {
            const existingPrediction =
                await Prediction
                    .findOne({
                        fixtureId:
                            normalized.fixtureId
                    })
                    .lean();

            if (
                existingPrediction
            ) {
                return existingPrediction;
            }
        }

        throw error;
    }
}

// ==========================================
// GENERATE DAILY
// ==========================================

export async function generateDailyPredictions() {
    console.log(
        "[PredictionService] Starting daily prediction generation..."
    );

    const fixtures =
        await getTodayMatches();

    if (
        !Array.isArray(
            fixtures
        )
    ) {
        throw new Error(
            "getTodayMatches() did not return an array."
        );
    }

    console.log(
        `[PredictionService] Fixtures received: ${fixtures.length}`
    );

    const results = [];

    for (
        const fixture of fixtures
    ) {
        try {
            const prediction =
                await createPrediction(
                    fixture
                );

            results.push(
                prediction
            );

        } catch (error) {
            console.error(
                "[PredictionService] Fixture failed:",
                error?.message ||
                error
            );
        }
    }

    console.log(
        `[PredictionService] Predictions generated: ${results.length}`
    );

    return results;
}

// ==========================================
// RECALCULATE PREMIUM PREDICTIONS
// ==========================================
//
// Used by:
// POST /api/admin/recalculate-premium
//
// This recalculates premium scores for the
// predictions already stored in MongoDB.
//
// It then ranks the strongest predictions
// and marks the qualifying predictions as
// premium.
// ==========================================

export async function recalculatePremiumPredictions() {
    console.log(
        "[PredictionService] Recalculating premium predictions..."
    );

    // --------------------------------------
    // Get today's predictions
    // --------------------------------------

    const start =
        new Date();

    start.setHours(
        0,
        0,
        0,
        0
    );

    const end =
        new Date(start);

    end.setDate(
        end.getDate() + 1
    );

    const predictions =
        await Prediction
            .find({
                matchDate: {
                    $gte: start,
                    $lt: end
                }
            })
            .sort({
                premiumScore: -1,
                "confidence.confidence": -1
            });

    console.log(
        `[PredictionService] Predictions found for premium calculation: ${predictions.length}`
    );

    if (
        predictions.length === 0
    ) {
        return {
            totalProcessed: 0,
            premiumCount: 0,
            message:
                "No predictions found for today."
        };
    }

    // --------------------------------------
    // Calculate scores
    // --------------------------------------

    const scoredPredictions =
        [];

    for (
        const prediction
        of predictions
    ) {
        try {
            const plain =
                prediction.toObject();

            const premiumScore =
                calculatePremiumScore(
                    plain
                );

            const premiumCriteria =
                buildPremiumCriteria(
                    plain,
                    premiumScore
                );

            scoredPredictions.push({
                prediction,
                premiumScore,
                premiumCriteria
            });

        } catch (error) {
            console.error(
                `[PredictionService] Premium scoring failed for fixture ${prediction.fixtureId}:`,
                error?.message ||
                error
            );
        }
    }

    // --------------------------------------
    // Rank by premium score
    // --------------------------------------

    scoredPredictions.sort(
        (a, b) =>
            b.premiumScore -
            a.premiumScore
    );

    // --------------------------------------
    // Determine premium predictions
    // --------------------------------------
    //
    // A prediction must satisfy the quality
    // criteria and have a score >= 70.
    //
    // Maximum 10 premium predictions are
    // selected for the day.
    // --------------------------------------

    const qualified =
        scoredPredictions.filter(
            item =>
                item.premiumCriteria
                    .premiumQualified
        );

    const premiumLimit =
        Math.min(
            10,
            qualified.length
        );

    const premiumIds =
        new Set();

    for (
        let index = 0;
        index < premiumLimit;
        index++
    ) {
        premiumIds.add(
            String(
                qualified[index]
                    .prediction
                    ._id
            )
        );
    }

    // --------------------------------------
    // Update database
    // --------------------------------------

    let premiumCount = 0;

    for (
        let index = 0;
        index <
        scoredPredictions.length;
        index++
    ) {
        const item =
            scoredPredictions[index];

        const prediction =
            item.prediction;

        const id =
            String(
                prediction._id
            );

        const isPremium =
            premiumIds.has(id);

        if (isPremium) {
            premiumCount++;
        }

        prediction.premiumScore =
            item.premiumScore;

        prediction.premiumCriteria =
            item.premiumCriteria;

        prediction.isPremium =
            isPremium;

        prediction.premiumRank =
            isPremium
                ? (
                    [...premiumIds]
                        .indexOf(id) + 1
                )
                : null;

        prediction.dailyPremiumScore =
            item.premiumScore;

        await prediction.save();
    }

    // --------------------------------------
    // Return summary
    // --------------------------------------

    const topPredictions =
        scoredPredictions
            .slice(0, 10)
            .map(item => ({
                fixtureId:
                    item.prediction
                        .fixtureId,

                homeTeam:
                    item.prediction
                        .homeTeam,

                awayTeam:
                    item.prediction
                        .awayTeam,

                premiumScore:
                    item.premiumScore,

                isPremium:
                    item.prediction
                        .isPremium,

                premiumRank:
                    item.prediction
                        .premiumRank
            }));

    console.log(
        `[PredictionService] Premium recalculation complete. Processed: ${scoredPredictions.length}, Premium: ${premiumCount}`
    );

    return {
        totalProcessed:
            scoredPredictions.length,

        premiumCount,

        qualifiedCount:
            qualified.length,

        topPredictions
    };
}

// ==========================================
// UPDATE
// ==========================================

export async function updatePrediction(
    id,
    data
) {
    const normalized =
        String(
            id ?? ""
        ).trim();

    if (!normalized) {
        return null;
    }

    if (
        isValidObjectId(
            normalized
        )
    ) {
        return Prediction
            .findByIdAndUpdate(
                normalized,
                data,
                {
                    new: true,
                    runValidators: true
                }
            )
            .lean();
    }

    const fixtureId =
        safeNumber(
            normalized,
            NaN
        );

    if (
        !Number.isFinite(
            fixtureId
        ) ||
        fixtureId <= 0
    ) {
        return null;
    }

    return Prediction
        .findOneAndUpdate(
            {
                fixtureId
            },
            data,
            {
                new: true,
                runValidators: true
            }
        )
        .lean();
}

// ==========================================
// DELETE
// ==========================================

export async function deletePrediction(
    id
) {
    const normalized =
        String(
            id ?? ""
        ).trim();

    if (!normalized) {
        return null;
    }

    if (
        isValidObjectId(
            normalized
        )
    ) {
        return Prediction
            .findByIdAndDelete(
                normalized
            )
            .lean();
    }

    const fixtureId =
        safeNumber(
            normalized,
            NaN
        );

    if (
        !Number.isFinite(
            fixtureId
        ) ||
        fixtureId <= 0
    ) {
        return null;
    }

    return Prediction
        .findOneAndDelete({
            fixtureId
        })
        .lean();
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    getAllPredictions,
    getPredictionById,
    getPredictionByFixtureId,
    createPrediction,
    generateDailyPredictions,
    recalculatePremiumPredictions,
    updatePrediction,
    deletePrediction
};