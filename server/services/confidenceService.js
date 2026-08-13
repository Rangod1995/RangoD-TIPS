
// ==========================================
// server/services/confidenceService.js
// RangoD AI Engine V7 Enterprise
// Enterprise Confidence Intelligence
// ==========================================

function safeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function clamp(value, min = 0, max = 100) {
    return Math.max(
        min,
        Math.min(
            max,
            safeNumber(value, min)
        )
    );
}

function round(value, decimals = 2) {
    return Number(
        safeNumber(value).toFixed(decimals)
    );
}

function average(values = []) {
    const validValues = values
        .map(value => safeNumber(value))
        .filter(value => Number.isFinite(value));

    if (!validValues.length) {
        return 0;
    }

    return (
        validValues.reduce(
            (sum, value) => sum + value,
            0
        ) / validValues.length
    );
}

// ==========================================
// Probability Analysis
// ==========================================

function probabilityStrength(probabilities = {}) {
    const values = [
        probabilities.homeWin,
        probabilities.draw,
        probabilities.awayWin,
        probabilities.over15,
        probabilities.over25,
        probabilities.over35,
        probabilities.bttsYes,
        probabilities.bttsNo
    ];

    return clamp(
        Math.max(
            ...values.map(value =>
                safeNumber(value)
            ),
            0
        ),
        0,
        100
    );
}

function probabilitySpread(probabilities = {}) {
    const values = [
        safeNumber(probabilities.homeWin),
        safeNumber(probabilities.draw),
        safeNumber(probabilities.awayWin)
    ].sort((a, b) => b - a);

    if (values.length < 2) {
        return 0;
    }

    return clamp(
        values[0] - values[1],
        0,
        100
    );
}

// ==========================================
// Statistics Intelligence
// ==========================================

function statisticsConfidence(
    homeStatistics = {},
    awayStatistics = {}
) {
    const homePower =
        safeNumber(
            homeStatistics.teamPowerIndex,
            50
        );

    const awayPower =
        safeNumber(
            awayStatistics.teamPowerIndex,
            50
        );

    const homeConfidence =
        safeNumber(
            homeStatistics.confidence,
            50
        );

    const awayConfidence =
        safeNumber(
            awayStatistics.confidence,
            50
        );

    const powerDifference =
        Math.abs(
            homePower - awayPower
        );

    return clamp(
        (
            homeConfidence +
            awayConfidence
        ) / 2
        +
        Math.min(
            powerDifference * 0.25,
            10
        ),
        50,
        97
    );
}

// ==========================================
// Form Intelligence
// ==========================================

function formConfidence(
    homeStatistics = {},
    awayStatistics = {}
) {
    const homeMomentum =
        safeNumber(
            homeStatistics.metrics?.momentum,
            50
        );

    const awayMomentum =
        safeNumber(
            awayStatistics.metrics?.momentum,
            50
        );

    const homeConsistency =
        safeNumber(
            homeStatistics.metrics?.consistency,
            50
        );

    const awayConsistency =
        safeNumber(
            awayStatistics.metrics?.consistency,
            50
        );

    return clamp(
        (
            homeMomentum +
            awayMomentum +
            homeConsistency +
            awayConsistency
        ) / 4,
        50,
        97
    );
}

// ==========================================
// Market Agreement
// ==========================================

function marketAgreement(
    probabilities = {},
    predictionMarkets = {}
) {
    const probability =
        probabilityStrength(
            probabilities
        );

    const marketConfidence =
        safeNumber(
            predictionMarkets.confidence,
            70
        );

    return clamp(
        (
            probability * 0.6
        ) +
        (
            marketConfidence * 0.4
        ),
        50,
        97
    );
}

// ==========================================
// Validation Confidence
// ==========================================

function validationConfidence(
    validation = {}
) {
    const quality =
        safeNumber(
            validation.qualityScore,
            60
        );

    const accuracy =
        safeNumber(
            validation.accuracyScore,
            60
        );

    const warnings =
        Array.isArray(
            validation.warnings
        )
            ? validation.warnings.length
            : 0;

    return clamp(
        (
            quality * 0.65 +
            accuracy * 0.35
        ) -
        warnings * 3,
        50,
        97
    );
}

// ==========================================
// Model Agreement
// ==========================================

function calculateModelAgreement(
    models = {}
) {
    const values = [
        models.scoreline,
        models.probability,
        models.market,
        models.ai
    ]
        .map(value =>
            safeNumber(value, 50)
        );

    if (!values.length) {
        return 50;
    }

    const avg =
        average(values);

    const variance =
        average(
            values.map(value =>
                Math.pow(
                    value - avg,
                    2
                )
            )
        );

    const disagreement =
        Math.sqrt(variance);

    return clamp(
        100 - disagreement,
        50,
        97
    );
}

// ==========================================
// Goal Model Reliability
// ==========================================

function goalModelConfidence(
    homeStatistics = {},
    awayStatistics = {}
) {
    const homeGoals =
        safeNumber(
            homeStatistics.derived?.goalsPerGame,
            0
        );

    const awayGoals =
        safeNumber(
            awayStatistics.derived?.goalsPerGame,
            0
        );

    const homeConceding =
        safeNumber(
            homeStatistics.derived?.concededPerGame,
            0
        );

    const awayConceding =
        safeNumber(
            awayStatistics.derived?.concededPerGame,
            0
        );

    const attackingBalance =
        Math.abs(
            homeGoals -
            awayGoals
        );

    const defensiveBalance =
        Math.abs(
            homeConceding -
            awayConceding
        );

    const instability =
        (
            attackingBalance +
            defensiveBalance
        ) * 10;

    return clamp(
        90 - instability,
        50,
        95
    );
}

// ==========================================
// Data Reliability
// ==========================================

function dataReliability(
    dataQuality = 1
) {
    let quality =
        safeNumber(
            dataQuality,
            0.7
        );

    // Support both:
    // 0.0 - 1.0
    // 0 - 100
    if (quality <= 1) {
        quality *= 100;
    }

    return clamp(
        quality,
        50,
        97
    );
}

// ==========================================
// Risk Calculation
// ==========================================

export function calculateRisk(
    confidence,
    warnings = []
) {
    const score =
        safeNumber(
            confidence,
            50
        );

    const warningCount =
        Array.isArray(warnings)
            ? warnings.length
            : 0;

    return clamp(
        100 -
        score +
        warningCount * 3,
        0,
        100
    );
}

// ==========================================
// Main Confidence Engine
// ==========================================

export function calculateConfidence({
    probabilities = {},
    homeStatistics = {},
    awayStatistics = {},
    scorePrediction = {},
    validation = {},
    predictionMarkets = {},
    modelOutputs = {},
    dataQuality = 1
} = {}) {

    const probabilityScore =
        probabilityStrength(
            probabilities
        );

    const spreadScore =
        clamp(
            50 +
            probabilitySpread(
                probabilities
            ),
            50,
            97
        );

    const statisticsScore =
        statisticsConfidence(
            homeStatistics,
            awayStatistics
        );

    const formScore =
        formConfidence(
            homeStatistics,
            awayStatistics
        );

    const marketScore =
        marketAgreement(
            probabilities,
            predictionMarkets
        );

    const validationScore =
        validationConfidence(
            validation
        );

    const agreementScore =
        calculateModelAgreement(
            modelOutputs
        );

    const goalScore =
        goalModelConfidence(
            homeStatistics,
            awayStatistics
        );

    const dataScore =
        dataReliability(
            dataQuality
        );

    // ==========================================
    // Weighted Enterprise Confidence
    // ==========================================

    const rawConfidence =

        probabilityScore * 0.20

        +

        spreadScore * 0.10

        +

        statisticsScore * 0.20

        +

        formScore * 0.12

        +

        marketScore * 0.10

        +

        validationScore * 0.12

        +

        agreementScore * 0.08

        +

        goalScore * 0.05

        +

        dataScore * 0.03;

    const confidenceScore =
        Math.round(
            clamp(
                rawConfidence,
                50,
                97
            )
        );

    // ==========================================
    // ALWAYS RETURN OBJECT
    // ==========================================

    const result = {
        confidence: confidenceScore,

        breakdown: {
            probability:
                round(
                    probabilityScore
                ),

            spread:
                round(
                    spreadScore
                ),

            statistics:
                round(
                    statisticsScore
                ),

            form:
                round(
                    formScore
                ),

            market:
                round(
                    marketScore
                ),

            validation:
                round(
                    validationScore
                ),

            agreement:
                round(
                    agreementScore
                ),

            goalModel:
                round(
                    goalScore
                ),

            data:
                round(
                    dataScore
                )
        }
    };

    // ==========================================
    // Safety Guard
    // ==========================================

    if (
        typeof result !== "object" ||
        result === null
    ) {
        return {
            confidence: 50,
            breakdown: {}
        };
    }

    if (
        typeof result.breakdown !== "object" ||
        result.breakdown === null
    ) {
        result.breakdown = {};
    }

    result.confidence =
        clamp(
            result.confidence,
            50,
            97
        );

    return result;
}

// ==========================================
// Confidence Label
// ==========================================

export function confidenceLabel(
    confidence
) {
    const value =
        safeNumber(
            confidence,
            50
        );

    if (value >= 92) {
        return "Elite";
    }

    if (value >= 85) {
        return "Very High";
    }

    if (value >= 75) {
        return "High";
    }

    if (value >= 65) {
        return "Medium";
    }

    return "Low";
}

// ==========================================
// Reliability Score
// ==========================================

export function calculateReliability(
    confidenceResult = {}
) {
    // Defensive normalization.
    // Prevents:
    // Cannot read properties of number
    // or Cannot create property 'breakdown'
    if (
        typeof confidenceResult === "number"
    ) {
        confidenceResult = {
            confidence:
                confidenceResult,
            breakdown: {}
        };
    }

    if (
        !confidenceResult ||
        typeof confidenceResult !== "object"
    ) {
        confidenceResult = {
            confidence: 50,
            breakdown: {}
        };
    }

    const breakdown =
        (
            confidenceResult.breakdown &&
            typeof confidenceResult.breakdown === "object"
        )
            ? confidenceResult.breakdown
            : {};

    const values = [
        breakdown.statistics,
        breakdown.validation,
        breakdown.agreement,
        breakdown.form,
        breakdown.probability
    ];

    const score =
        average(values);

    return Math.round(
        clamp(
            score || 50,
            50,
            97
        )
    );
}

// ==========================================
// Risk Level
// ==========================================

export function riskLevel(
    confidence,
    warnings = []
) {
    const value =
        safeNumber(
            confidence,
            50
        );

    const warningList =
        Array.isArray(warnings)
            ? warnings
            : [];

    let risk =
        100 - value;

    risk +=
        warningList.length * 4;

    risk =
        clamp(
            risk,
            0,
            100
        );

    if (risk <= 15) {
        return "Very Low";
    }

    if (risk <= 30) {
        return "Low";
    }

    if (risk <= 50) {
        return "Medium";
    }

    return "High";
}

// ==========================================
// Enterprise Confidence Builder
// ==========================================

export function buildConfidenceReport(
    result = {},
    warnings = []
) {
    // Defensive handling of numeric confidence
    if (
        typeof result === "number"
    ) {
        result = {
            confidence: result,
            breakdown: {}
        };
    }

    if (
        !result ||
        typeof result !== "object"
    ) {
        result = {
            confidence: 50,
            breakdown: {}
        };
    }

    const confidence =
        safeNumber(
            result.confidence,
            50
        );

    const breakdown =
        (
            result.breakdown &&
            typeof result.breakdown === "object"
        )
            ? result.breakdown
            : {};

    return {
        confidence,

        label:
            confidenceLabel(
                confidence
            ),

        reliability:
            calculateReliability({
                confidence,
                breakdown
            }),

        risk:
            riskLevel(
                confidence,
                warnings
            ),

        breakdown,

        warnings:
            Array.isArray(warnings)
                ? warnings
                : []
    };
}

// ==========================================
// Confidence Comparison
// ==========================================

export function compareConfidence(
    first = {},
    second = {}
) {
    // Allow direct numbers as well.
    const firstScore =
        typeof first === "number"
            ? safeNumber(first)
            : safeNumber(
                first?.confidence
            );

    const secondScore =
        typeof second === "number"
            ? safeNumber(second)
            : safeNumber(
                second?.confidence
            );

    return {
        stronger:
            firstScore >= secondScore
                ? "first"
                : "second",

        difference:
            Math.abs(
                firstScore -
                secondScore
            )
    };
}

// ==========================================
// Default Export
// ==========================================

export default {
    calculateConfidence,
    confidenceLabel,
    calculateReliability,
    riskLevel,
    buildConfidenceReport,
    compareConfidence,
    calculateRisk
};

