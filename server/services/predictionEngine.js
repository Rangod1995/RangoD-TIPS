// ==========================================
// server/services/predictionEngine.js
// RangoD TIPS V7 Enterprise
// Balanced AI Prediction Engine
// ==========================================

import {
    getTeamStatistics,
    compareTeamStatistics,
    extractPredictionFeatures
} from "./statisticsService.js";

import {
    calculateConfidence,
    confidenceLabel
} from "./confidenceService.js";

import {
    selectBestMarket
} from "./marketSelector.js";

import {
    calculateExpectedScore
} from "./scorelineService.js";

import {
    validatePrediction
} from "./predictionValidator.js";

import {
    getHeadToHead
} from "./headToHeadService.js";

import {
    getWeatherImpact
} from "./weatherService.js";

import {
    getMotivationAnalysis
} from "./motivationService.js";

// ==========================================
// HELPERS
// ==========================================

function safeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

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
            safeNumber(
                value,
                min
            )
        )
    );
}

function round(
    value,
    decimals = 2
) {

    return Number(
        safeNumber(value)
            .toFixed(decimals)
    );
}

// ==========================================
// POISSON
// ==========================================

function poissonProbability(
    goals,
    expectedGoals
) {

    const lambda =
        Math.max(
            0.05,
            safeNumber(
                expectedGoals,
                1
            )
        );

    const factorial =
        goals <= 1
            ? 1
            : Array.from(
                {
                    length:
                        goals
                },
                (_, index) =>
                    index + 1
            ).reduce(
                (
                    total,
                    value
                ) =>
                    total * value,
                1
            );

    return (
        Math.exp(-lambda) *
        Math.pow(
            lambda,
            goals
        ) /
        factorial
    );
}

// ==========================================
// POISSON GOAL DISTRIBUTION
// ==========================================

function calculatePoissonProbabilities(
    expectedHome,
    expectedAway
) {

    const maxGoals = 10;

    const homeDistribution =
        Array.from(
            {
                length:
                    maxGoals + 1
            },
            (_, goals) =>
                poissonProbability(
                    goals,
                    expectedHome
                )
        );

    const awayDistribution =
        Array.from(
            {
                length:
                    maxGoals + 1
            },
            (_, goals) =>
                poissonProbability(
                    goals,
                    expectedAway
                )
        );

    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;

    let over15 = 0;
    let over25 = 0;
    let over35 = 0;

    let under25 = 0;

    for (
        let homeGoals = 0;
        homeGoals <= maxGoals;
        homeGoals++
    ) {

        for (
            let awayGoals = 0;
            awayGoals <= maxGoals;
            awayGoals++
        ) {

            const probability =
                homeDistribution[
                    homeGoals
                ] *
                awayDistribution[
                    awayGoals
                ];

            if (
                homeGoals >
                awayGoals
            ) {
                homeWin += probability;
            }

            else if (
                homeGoals ===
                awayGoals
            ) {
                draw += probability;
            }

            else {
                awayWin += probability;
            }

            const totalGoals =
                homeGoals +
                awayGoals;

            if (
                totalGoals >= 2
            ) {
                over15 += probability;
            }

            if (
                totalGoals >= 3
            ) {
                over25 += probability;
            }

            if (
                totalGoals >= 4
            ) {
                over35 += probability;
            }

            if (
                totalGoals <= 2
            ) {
                under25 += probability;
            }
        }
    }

    // ======================================
    // BTTS
    // ======================================

    const bttsYes =
        (
            1 -
            Math.exp(
                -expectedHome
            )
        ) *
        (
            1 -
            Math.exp(
                -expectedAway
            )
        );

    const bttsNo =
        1 -
        bttsYes;

    return {

        homeWin:
            clamp(
                homeWin * 100
            ),

        draw:
            clamp(
                draw * 100
            ),

        awayWin:
            clamp(
                awayWin * 100
            ),

        over15:
            clamp(
                over15 * 100
            ),

        over25:
            clamp(
                over25 * 100
            ),

        over35:
            clamp(
                over35 * 100
            ),

        under25:
            clamp(
                under25 * 100
            ),

        bttsYes:
            clamp(
                bttsYes * 100
            ),

        bttsNo:
            clamp(
                bttsNo * 100
            )
    };
}

// ==========================================
// ADD TEAM STRENGTH ADJUSTMENT
// ==========================================

function adjustResultProbabilities(
    probabilities,
    homeStatistics,
    awayStatistics
) {

    const homePower =
        safeNumber(
            homeStatistics?.teamPowerIndex,
            50
        );

    const awayPower =
        safeNumber(
            awayStatistics?.teamPowerIndex,
            50
        );

    const difference =
        homePower -
        awayPower;

    const adjustment =
        clamp(
            difference * 0.10,
            -8,
            8
        );

    let homeWin =
        probabilities.homeWin +
        adjustment;

    let awayWin =
        probabilities.awayWin -
        adjustment;

    let draw =
        probabilities.draw;

    homeWin =
        Math.max(
            1,
            homeWin
        );

    awayWin =
        Math.max(
            1,
            awayWin
        );

    draw =
        Math.max(
            1,
            draw
        );

    const total =
        homeWin +
        draw +
        awayWin;

    return {

        ...probabilities,

        homeWin:
            clamp(
                (
                    homeWin /
                    total
                ) *
                100
            ),

        draw:
            clamp(
                (
                    draw /
                    total
                ) *
                100
            ),

        awayWin:
            clamp(
                (
                    awayWin /
                    total
                ) *
                100
            )
    };
}

// ==========================================
// NORMALIZE PROBABILITIES
// ==========================================

function normalizeProbabilities(
    probabilities = {}
) {

    return {

        homeWin:
            round(
                clamp(
                    probabilities.homeWin
                )
            ),

        draw:
            round(
                clamp(
                    probabilities.draw
                )
            ),

        awayWin:
            round(
                clamp(
                    probabilities.awayWin
                )
            ),

        over15:
            round(
                clamp(
                    probabilities.over15
                )
            ),

        over25:
            round(
                clamp(
                    probabilities.over25
                )
            ),

        over35:
            round(
                clamp(
                    probabilities.over35
                )
            ),

        under25:
            round(
                clamp(
                    probabilities.under25
                )
            ),

        bttsYes:
            round(
                clamp(
                    probabilities.bttsYes
                )
            ),

        bttsNo:
            round(
                clamp(
                    probabilities.bttsNo
                )
            )
    };
}

// ==========================================
// CALCULATE PROBABILITIES
// ==========================================

function calculateProbabilities({

    homeStatistics,

    awayStatistics,

    expectedScore

}) {

    const expectedHome =
        Math.max(
            0.15,
            safeNumber(
                expectedScore?.expectedHome ??
                expectedScore?.home,
                1
            )
        );

    const expectedAway =
        Math.max(
            0.15,
            safeNumber(
                expectedScore?.expectedAway ??
                expectedScore?.away,
                1
            )
        );

    const probabilities =
        calculatePoissonProbabilities(
            expectedHome,
            expectedAway
        );

    const adjusted =
        adjustResultProbabilities(

            probabilities,

            homeStatistics,

            awayStatistics

        );

    return normalizeProbabilities(
        adjusted
    );
}

// ==========================================
// PREMIUM CLASSIFIER
// ==========================================

function determinePremiumStatus({

    confidence,

    validation,

    probabilities,

    selectedMarket,

    homeStatistics,

    awayStatistics

}) {

    const finalConfidence =
        clamp(
            confidence
        );

    const qualityScore =
        clamp(

            validation?.qualityScore ??
            validation?.score ??
            0
        );

    const marketConfidence =
        clamp(

            selectedMarket?.confidence ??
            selectedMarket?.score ??
            0
        );

    const marketProbability =
        clamp(

            selectedMarket?.probability ??
            0
        );

    const homeQuality =
        clamp(

            homeStatistics?.dataQuality ??
            homeStatistics?.qualityScore ??
            65
        );

    const awayQuality =
        clamp(

            awayStatistics?.dataQuality ??
            awayStatistics?.qualityScore ??
            65
        );

    const averageDataQuality =
        (
            homeQuality +
            awayQuality
        ) / 2;

    const risk =
        String(

            validation?.risk ??
            selectedMarket?.risk ??
            "medium"

        ).toLowerCase();

    // ======================================
    // SCORE
    // ======================================

    let premiumScore = 0;

    // Model confidence
    if (
        finalConfidence >= 75
    ) {
        premiumScore += 30;
    }

    else if (
        finalConfidence >= 70
    ) {
        premiumScore += 24;
    }

    else if (
        finalConfidence >= 65
    ) {
        premiumScore += 18;
    }

    // Validation
    if (
        qualityScore >= 75
    ) {
        premiumScore += 25;
    }

    else if (
        qualityScore >= 65
    ) {
        premiumScore += 20;
    }

    else if (
        qualityScore >= 60
    ) {
        premiumScore += 15;
    }

    // Market confidence
    if (
        marketConfidence >= 75
    ) {
        premiumScore += 20;
    }

    else if (
        marketConfidence >= 68
    ) {
        premiumScore += 16;
    }

    else if (
        marketConfidence >= 62
    ) {
        premiumScore += 12;
    }

    // Market probability
    if (
        marketProbability >= 75
    ) {
        premiumScore += 15;
    }

    else if (
        marketProbability >= 68
    ) {
        premiumScore += 12;
    }

    else if (
        marketProbability >= 60
    ) {
        premiumScore += 8;
    }

    // Data quality
    if (
        averageDataQuality >= 75
    ) {
        premiumScore += 10;
    }

    else if (
        averageDataQuality >= 65
    ) {
        premiumScore += 7;
    }

    // Risk
    if (
        risk === "low"
    ) {
        premiumScore += 5;
    }

    else if (
        risk === "medium"
    ) {
        premiumScore += 3;
    }

    // ======================================
    // PREMIUM THRESHOLD
    // ======================================

    const isPremium =
        premiumScore >= 65 &&
        finalConfidence >= 68 &&
        qualityScore >= 60 &&
        marketProbability >= 58;

    return {

        isPremium,

        premiumScore:
            Math.round(
                premiumScore
            ),

        criteria: {

            confidence:
                finalConfidence,

            validation:
                qualityScore,

            marketConfidence,

            marketProbability,

            averageDataQuality,

            risk
        }
    };
}

// ==========================================
// MAIN PREDICTION GENERATOR
// ==========================================

export async function generatePrediction({

    fixtureId,

    homeTeam,

    awayTeam,

    league,

    homeTeamId,

    awayTeamId,

    leagueStrength = 50,

    matchDate = null

}) {

    // ======================================
    // GATHER INTELLIGENCE
    // ======================================

    const [

        homeStatistics,

        awayStatistics,

        headToHead,

        weather,

        motivation

    ] = await Promise.all([

        getTeamStatistics(
            homeTeamId,
            {
                leagueStrength
            }
        ),

        getTeamStatistics(
            awayTeamId,
            {
                leagueStrength
            }
        ),

        getHeadToHead(
            homeTeamId,
            awayTeamId
        ),

        getWeatherImpact({

            fixture: {

                date:
                    matchDate ||
                    new Date()

            }

        }),

        getMotivationAnalysis(
            homeTeam,
            awayTeam
        )

    ]);

    // ======================================
    // COMPARISON
    // ======================================

    const comparison =
        compareTeamStatistics(

            homeStatistics,

            awayStatistics

        );

    // ======================================
    // EXPECTED SCORE
    // ======================================

    const expectedScore =
        await calculateExpectedScore({

            homeStatistics,

            awayStatistics,

            comparison,

            headToHead,

            weather,

            motivation

        });

    const expectedHome =
        Math.max(

            0,

            round(

                expectedScore?.expectedHome ??
                expectedScore?.home ??
                1,

                2

            )
        );

    const expectedAway =
        Math.max(

            0,

            round(

                expectedScore?.expectedAway ??
                expectedScore?.away ??
                1,

                2

            )
        );

    const normalizedExpectedScore = {

        ...expectedScore,

        expectedHome,

        expectedAway,

        home:
            expectedHome,

        away:
            expectedAway
    };

    // ======================================
    // PROBABILITIES
    // ======================================

    const probabilities =
        calculateProbabilities({

            homeStatistics,

            awayStatistics,

            expectedScore:
                normalizedExpectedScore

        });

    console.log(
        `[PredictionEngine] ${homeTeam} vs ${awayTeam}`
    );

    console.log(
        "[PredictionEngine] Probabilities:",
        probabilities
    );

    // ======================================
    // PRELIMINARY CONFIDENCE
    // ======================================

    const preliminaryConfidence =
        clamp(

            safeNumber(

                expectedScore?.probability,

                68

            ),

            45,

            95

        );

    // ======================================
    // INITIAL MARKET
    // ======================================

    const selectedMarket =
        selectBestMarket({

            probabilities,

            confidence:
                preliminaryConfidence,

            homeStatistics,

            awayStatistics,

            comparison

        });

    const finalMarket =
        selectedMarket || {

            market:
                "over15",

            label:
                "Over 1.5 Goals",

            probability:
                probabilities.over15,

            risk:
                "low",

            score:
                probabilities.over15,

            confidence:
                preliminaryConfidence,

            reason:
                "Fallback statistical selection."

        };

    // ======================================
    // MODEL OUTPUTS
    // ======================================

    const modelOutputs = {

        scoreline:
            preliminaryConfidence,

        probability:
            finalMarket.probability,

        market:
            finalMarket.confidence ??
            finalMarket.score ??
            preliminaryConfidence
    };

    // ======================================
    // PRELIMINARY VALIDATION
    // ======================================

    const preliminaryValidation =
        validatePrediction({

            selectedMarket:
                finalMarket,

            scorePrediction:
                normalizedExpectedScore,

            probabilities,

            confidence:
                preliminaryConfidence,

            statistics: {

                home:
                    homeStatistics,

                away:
                    awayStatistics

            },

            modelOutputs

        });

    // ======================================
    // CONFIDENCE
    // ======================================

    const confidenceResult =
        calculateConfidence({

            probabilities,

            homeStatistics,

            awayStatistics,

            validation:
                preliminaryValidation,

            predictionMarkets: {

                confidence:
                    safeNumber(

                        finalMarket.confidence,

                        preliminaryConfidence

                    )

            },

            modelOutputs,

            dataQuality: 1

        });

    const confidenceScore =
        clamp(

            safeNumber(

                confidenceResult?.confidence,

                preliminaryConfidence

            ),

            0,

            100

        );

    // ======================================
    // FINAL VALIDATION
    // ======================================

    const validation =
        validatePrediction({

            selectedMarket:
                finalMarket,

            scorePrediction:
                normalizedExpectedScore,

            probabilities,

            confidence:
                confidenceScore,

            statistics: {

                home:
                    homeStatistics,

                away:
                    awayStatistics

            },

            modelOutputs

        });

    // ======================================
    // FINAL CONFIDENCE
    // ======================================

    const confidence = {

        confidence:
            Math.round(
                confidenceScore
            ),

        label:
            confidenceLabel(
                confidenceScore
            ),

        risk:
            validation?.risk ??
            finalMarket.risk ??
            "medium",

        breakdown:
            confidenceResult?.breakdown ??
            {}

    };

    // ======================================
    // PREMIUM
    // ======================================

    const premium =
        determinePremiumStatus({

            confidence:
                confidenceScore,

            validation,

            probabilities,

            selectedMarket:
                finalMarket,

            homeStatistics,

            awayStatistics

        });

    // ======================================
    // ALTERNATIVE MARKETS
    // ======================================

    const alternativeMarkets = [

        {
            market:
                "Home Win",

            probability:
                probabilities.homeWin
        },

        {
            market:
                "Draw",

            probability:
                probabilities.draw
        },

        {
            market:
                "Away Win",

            probability:
                probabilities.awayWin
        },

        {
            market:
                "Over 1.5 Goals",

            probability:
                probabilities.over15
        },

        {
            market:
                "Over 2.5 Goals",

            probability:
                probabilities.over25
        },

        {
            market:
                "Under 2.5 Goals",

            probability:
                probabilities.under25
        },

        {
            market:
                "BTTS Yes",

            probability:
                probabilities.bttsYes
        },

        {
            market:
                "BTTS No",

            probability:
                probabilities.bttsNo
        }

    ]

        .filter(
            market =>
                market.market !==
                finalMarket.label &&
                market.probability >= 45
        )

        .sort(
            (a, b) =>
                b.probability -
                a.probability
        )

        .slice(
            0,
            4
        );

    // ======================================
    // FINAL RESULT
    // ======================================

    return {

        fixtureId,

        match: {

            homeTeam,

            awayTeam,

            league
        },

        prediction: {

            score: {

                home:
                    expectedHome,

                away:
                    expectedAway

            },

            expectedScore:
                normalizedExpectedScore,

            probabilities,

            recommendedMarket:
                finalMarket,

            alternativeMarkets

        },

        intelligence: {

            homeStatistics,

            awayStatistics,

            comparison,

            headToHead,

            weather,

            motivation

        },

        confidence,

        validation,

        isPremium:
            premium.isPremium,

        premiumScore:
            premium.premiumScore,

        premiumCriteria:
            premium.criteria,

        features: {

            home:
                extractPredictionFeatures(
                    homeStatistics
                ),

            away:
                extractPredictionFeatures(
                    awayStatistics
                )

        },

        metadata: {

            engine:
                "RangoD AI Engine V7 Enterprise",

            version:
                "7.3",

            generatedAt:
                new Date().toISOString()

        }

    };
}

// ==========================================
// BATCH GENERATOR
// ==========================================

export async function generateMultiplePredictions(
    fixtures = []
) {

    const results = [];

    for (
        const fixture
        of fixtures
    ) {

        try {

            const result =
                await generatePrediction(
                    fixture
                );

            results.push(
                result
            );

        } catch (error) {

            console.error(

                `[PredictionEngine] Fixture ${fixture?.fixtureId} failed:`,

                error?.message ||
                error

            );

            results.push({

                fixtureId:
                    fixture?.fixtureId,

                error:
                    error?.message ||
                    "Prediction generation failed"

            });
        }
    }

    return results;
}

// ==========================================
// SUMMARY
// ==========================================

export function predictionSummary(
    prediction = {}
) {

    return {

        match:
            prediction.match,

        score:
            prediction.prediction?.score,

        market:
            prediction.prediction
                ?.recommendedMarket,

        confidence:
            prediction.confidence
                ?.confidence,

        label:
            prediction.confidence
                ?.label,

        risk:
            prediction.confidence
                ?.risk,

        isPremium:
            Boolean(
                prediction.isPremium
            ),

        premiumScore:
            prediction.premiumScore ??
            0

    };
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {

    generatePrediction,

    generateMultiplePredictions,

    predictionSummary

};