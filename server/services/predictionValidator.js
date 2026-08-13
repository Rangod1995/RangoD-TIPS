
// ==========================================
// server/services/predictionValidator.js
// RangoD AI Engine V7 Enterprise
// Prediction Validation Service
// ==========================================

// ==========================================
// Helpers
// ==========================================

function safeNumber(value, fallback = 0) {
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

function round(
    value,
    decimals = 2
) {
    return Number(
        safeNumber(value).toFixed(decimals)
    );
}

// ==========================================
// Resolve Confidence
// ==========================================

function resolveConfidence(
    confidence
) {

    if (
        confidence &&
        typeof confidence === "object"
    ) {

        return clamp(
            confidence.confidence,
            50,
            97
        );
    }

    return clamp(
        confidence,
        50,
        97
    );
}

// ==========================================
// Market Probability Resolver
// ==========================================

function getMarketProbability(
    selectedMarket,
    probabilities = {}
) {

    if (!selectedMarket) {
        return 0;
    }

    const market =
        typeof selectedMarket === "string"
            ? selectedMarket
            : selectedMarket.market;

    const map = {

        homeWin:
            probabilities.homeWin,

        awayWin:
            probabilities.awayWin,

        draw:
            probabilities.draw,

        homeDoubleChance:
            probabilities.homeDoubleChance ??
            probabilities.homeOrDraw,

        awayDoubleChance:
            probabilities.awayDoubleChance ??
            probabilities.awayOrDraw,

        over15:
            probabilities.over15,

        over25:
            probabilities.over25,

        over35:
            probabilities.over35,

        under15:
            probabilities.under15,

        under25:
            probabilities.under25,

        under35:
            probabilities.under35,

        bttsYes:
            probabilities.bttsYes,

        bttsNo:
            probabilities.bttsNo
    };

    return clamp(
        map[market],
        0,
        100
    );
}

// ==========================================
// Score Validation
// ==========================================

function validateScorePrediction(
    scorePrediction = {}
) {

    const home =
        safeNumber(
            scorePrediction.expectedHomeGoals ??
            scorePrediction.expectedHome ??
            scorePrediction.home
        );

    const away =
        safeNumber(
            scorePrediction.expectedAwayGoals ??
            scorePrediction.expectedAway ??
            scorePrediction.away
        );

    if (
        home < 0 ||
        away < 0
    ) {

        return {

            valid: false,

            reason:
                "Negative expected goals",

            home,
            away
        };
    }

    if (
        home > 5 ||
        away > 5
    ) {

        return {

            valid: false,

            reason:
                "Unrealistic expected goals",

            home,
            away
        };
    }

    return {

        valid: true,

        reason:
            "Score prediction is valid",

        expectedGoals:
            round(
                home + away
            ),

        home:
            round(home),

        away:
            round(away)
    };
}

// ==========================================
// Statistics Validation
// ==========================================

function validateStatistics(
    statistics = {}
) {

    const home =
        statistics.home || {};

    const away =
        statistics.away || {};

    const homePower =
        safeNumber(
            home.teamPowerIndex,
            50
        );

    const awayPower =
        safeNumber(
            away.teamPowerIndex,
            50
        );

    return clamp(

        (
            homePower +
            awayPower
        ) / 2,

        50,
        97
    );
}

// ==========================================
// Model Agreement
// ==========================================

function calculateAgreement(
    models = {}
) {

    const values =
        Object.values(models)
            .map(value => {

                if (
                    value &&
                    typeof value === "object"
                ) {

                    return safeNumber(
                        value.confidence ??
                        value.score ??
                        value.probability,
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

    if (!values.length) {
        return 50;
    }

    const average =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / values.length;

    const variance =
        values.reduce(
            (sum, value) => {

                return (
                    sum +
                    Math.pow(
                        value - average,
                        2
                    )
                );

            },
            0
        ) / values.length;

    const disagreement =
        Math.sqrt(
            variance
        );

    return clamp(
        100 - disagreement,
        50,
        97
    );
}

// ==========================================
// Quality Score
// ==========================================

function calculateQualityScore({

    marketProbability,

    confidence,

    statistics,

    agreement,

    scoreValid

}) {

    let score =

        marketProbability * 0.30

        +

        confidence * 0.30

        +

        statistics * 0.20

        +

        agreement * 0.15;

    if (scoreValid) {

        score += 5;
    }

    return Math.round(
        clamp(
            score,
            0,
            100
        )
    );
}

// ==========================================
// Validation Risk
// ==========================================

function calculateRisk(
    qualityScore,
    confidence,
    warnings = []
) {

    let riskScore =
        100 - qualityScore;

    riskScore +=
        warnings.length * 3;

    if (
        confidence < 60
    ) {

        riskScore += 10;
    }

    riskScore =
        clamp(
            riskScore,
            0,
            100
        );

    if (
        riskScore <= 20
    ) {

        return "Very Low";
    }

    if (
        riskScore <= 35
    ) {

        return "Low";
    }

    if (
        riskScore <= 55
    ) {

        return "Medium";
    }

    return "High";
}

// ==========================================
// Enterprise Validator
// ==========================================

export function validatePrediction({

    selectedMarket,

    scorePrediction,

    probabilities = {},

    confidence = 60,

    statistics = {},

    modelOutputs = {}

}) {

    // ======================================
    // Market
    // ======================================

    const marketProbability =
        getMarketProbability(
            selectedMarket,
            probabilities
        );

    // ======================================
    // Score
    // ======================================

    const scoreValidation =
        validateScorePrediction(
            scorePrediction
        );

    // ======================================
    // Statistics
    // ======================================

    const statisticScore =
        validateStatistics(
            statistics
        );

    // ======================================
    // Model Agreement
    // ======================================

    const agreement =
        calculateAgreement(
            modelOutputs
        );

    // ======================================
    // Confidence
    // ======================================

    const baseConfidence =
        resolveConfidence(
            confidence
        );

    // ======================================
    // Quality
    // ======================================

    const qualityScore =
        calculateQualityScore({

            marketProbability,

            confidence:
                baseConfidence,

            statistics:
                statisticScore,

            agreement,

            scoreValid:
                scoreValidation.valid
        });

    // ======================================
    // Warnings
    // ======================================

    const warnings = [];

    let approved = true;

    // Low confidence
    if (
        baseConfidence < 60
    ) {

        approved = false;

        warnings.push(
            "Low confidence"
        );
    }

    // Weak market
    if (
        marketProbability < 55
    ) {

        approved = false;

        warnings.push(
            "Weak market probability"
        );
    }

    // Invalid score
    if (
        !scoreValidation.valid
    ) {

        approved = false;

        warnings.push(
            scoreValidation.reason
        );
    }

    // Model disagreement
    if (
        agreement < 60
    ) {

        warnings.push(
            "Model disagreement"
        );
    }

    // ======================================
    // Risk
    // ======================================

    const risk =
        calculateRisk(
            qualityScore,
            baseConfidence,
            warnings
        );

    // ======================================
    // Reasons
    // ======================================

    const reasons = [];

    if (
        approved
    ) {

        reasons.push(
            "Prediction passed validation"
        );

        reasons.push(
            "Models are sufficiently aligned"
        );

    } else {

        if (
            marketProbability >= 55
        ) {

            reasons.push(
                "Market probability is acceptable"
            );
        }

        if (
            scoreValidation.valid
        ) {

            reasons.push(
                "Expected score passed validation"
            );
        }

        if (
            agreement >= 60
        ) {

            reasons.push(
                "Prediction models show acceptable agreement"
            );
        }
    }

    // ======================================
    // Final Validation Object
    // ======================================

    return {

        approved,

        valid:
            approved,

        confidence:
            baseConfidence,

        qualityScore,

        marketProbability,

        probability:
            marketProbability,

        agreement:
            round(
                agreement
            ),

        statisticsScore:
            round(
                statisticScore
            ),

        risk,

        warnings,

        reasons,

        scoreValidation,

        validatedAt:
            new Date(),

        version:
            "7.0.0"
    };
}

// ==========================================
// Default Export
// ==========================================

export default {

    validatePrediction
};

