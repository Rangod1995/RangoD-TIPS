// ==========================================
// server/services/marketSelector.js
// RangoD TIPS V7 Enterprise
// Balanced Market Selector
// ==========================================

// ==========================================
// SAFE HELPERS
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
// MARKET CONFIG
// ==========================================

const MARKET_CONFIG = {

    homeWin: {
        minimum: 52,
        ideal: 70,
        risk: "medium",
        label: "Home Win"
    },

    draw: {
        minimum: 32,
        ideal: 42,
        risk: "high",
        label: "Draw"
    },

    awayWin: {
        minimum: 52,
        ideal: 70,
        risk: "medium",
        label: "Away Win"
    },

    over15: {
        minimum: 55,
        ideal: 75,
        risk: "low",
        label: "Over 1.5 Goals"
    },

    over25: {
        minimum: 50,
        ideal: 68,
        risk: "medium",
        label: "Over 2.5 Goals"
    },

    over35: {
        minimum: 42,
        ideal: 60,
        risk: "high",
        label: "Over 3.5 Goals"
    },

    under25: {
        minimum: 50,
        ideal: 68,
        risk: "medium",
        label: "Under 2.5 Goals"
    },

    bttsYes: {
        minimum: 52,
        ideal: 68,
        risk: "medium",
        label: "Both Teams To Score"
    },

    bttsNo: {
        minimum: 52,
        ideal: 68,
        risk: "medium",
        label: "Both Teams Not To Score"
    }

};

// ==========================================
// GET PROBABILITY
// ==========================================

function getProbability(
    probabilities,
    market
) {

    return clamp(
        probabilities?.[market],
        0,
        100
    );
}

// ==========================================
// MARKET SCORE
// ==========================================
//
// NO artificial bonus for low-risk markets.
// Probability is the primary signal.
//

function marketScore(
    probability,
    confidence,
    config
) {

    const probabilityScore =
        safeNumber(
            probability,
            0
        );

    const confidenceScore =
        safeNumber(
            confidence,
            60
        );

    const qualityBonus =
        calculateMarketQuality(
            probability,
            config
        );

    return clamp(

        (
            probabilityScore *
            0.60
        ) +

        (
            confidenceScore *
            0.20
        ) +

        (
            qualityBonus *
            0.20
        ),

        0,
        100
    );
}

// ==========================================
// MARKET QUALITY
// ==========================================

function calculateMarketQuality(
    probability,
    config
) {

    const minimum =
        safeNumber(
            config.minimum,
            50
        );

    const ideal =
        safeNumber(
            config.ideal,
            70
        );

    if (
        probability < minimum
    ) {
        return 0;
    }

    if (
        probability >= ideal
    ) {
        return 100;
    }

    const range =
        ideal - minimum;

    if (range <= 0) {
        return 100;
    }

    return clamp(

        (
            (
                probability -
                minimum
            ) /
            range
        ) *
        100,

        0,
        100
    );
}

// ==========================================
// REASON
// ==========================================

function getReason(
    market
) {

    const reasons = {

        homeWin:
            "Home advantage and team strength support a home victory.",

        draw:
            "The teams are closely matched, making the draw a strong possibility.",

        awayWin:
            "Away team strength and match indicators support an away victory.",

        over15:
            "Expected goals support at least two goals in the match.",

        over25:
            "The expected-goal model supports three or more goals.",

        over35:
            "The goal model indicates a strong possibility of four or more goals.",

        under25:
            "Expected goals and defensive indicators support fewer than three goals.",

        bttsYes:
            "Both teams have sufficient scoring probability to support BTTS.",

        bttsNo:
            "The model indicates one side has a meaningful probability of failing to score."

    };

    return (
        reasons[market] ||
        "Market supported by the RangoD AI model."
    );
}

// ==========================================
// GENERATE CANDIDATES
// ==========================================

function generateCandidates({

    probabilities = {},

    confidence = 60

}) {

    const markets = Object.keys(
        MARKET_CONFIG
    );

    const candidates = [];

    for (
        const market
        of markets
    ) {

        const config =
            MARKET_CONFIG[market];

        const probability =
            getProbability(
                probabilities,
                market
            );

        if (
            probability <
            config.minimum
        ) {
            continue;
        }

        const quality =
            calculateMarketQuality(
                probability,
                config
            );

        const score =
            marketScore(
                probability,
                confidence,
                config
            );

        const candidateConfidence =
            clamp(

                (
                    score *
                    0.70
                ) +

                (
                    quality *
                    0.30
                )

            );

        candidates.push({

            market,

            label:
                config.label,

            probability:
                round(
                    probability
                ),

            risk:
                config.risk,

            quality:
                round(
                    quality
                ),

            score:
                round(
                    score
                ),

            confidence:
                round(
                    candidateConfidence
                ),

            reason:
                getReason(
                    market
                )

        });
    }

    return candidates;
}

// ==========================================
// FALLBACK
// ==========================================

function generateFallbackMarket({

    probabilities = {},

    confidence = 60

}) {

    const candidates =
        Object.keys(
            MARKET_CONFIG
        ).map(
            market => {

                const config =
                    MARKET_CONFIG[
                        market
                    ];

                const probability =
                    getProbability(
                        probabilities,
                        market
                    );

                const score =
                    marketScore(
                        probability,
                        confidence,
                        config
                    );

                return {

                    market,

                    label:
                        config.label,

                    probability:
                        round(
                            probability
                        ),

                    risk:
                        config.risk,

                    quality:
                        round(
                            calculateMarketQuality(
                                probability,
                                config
                            )
                        ),

                    score:
                        round(
                            score
                        ),

                    confidence:
                        round(
                            score
                        ),

                    reason:
                        getReason(
                            market
                        )

                };
            }
        );

    candidates.sort(
        (a, b) =>
            b.probability -
            a.probability
    );

    return (
        candidates[0] ||
        null
    );
}

// ==========================================
// SELECT BEST MARKET
// ==========================================

export function selectBestMarket({

    probabilities = {},

    confidence = 60,

    validation = {}

}) {

    const normalizedConfidence =
        clamp(
            confidence
        );

    let candidates =
        generateCandidates({

            probabilities,

            confidence:
                normalizedConfidence

        });

    if (
        candidates.length === 0
    ) {

        return generateFallbackMarket({

            probabilities,

            confidence:
                normalizedConfidence

        });
    }

    const qualityScore =
        clamp(

            validation?.qualityScore ??
            validation?.score ??
            70,

            0,
            100
        );

    candidates =
        candidates.map(
            candidate => ({

                ...candidate,

                confidence:
                    round(

                        (
                            candidate.confidence *
                            0.80
                        ) +

                        (
                            qualityScore *
                            0.20
                        )

                    )

            })
        );

    candidates.sort(
        (a, b) => {

            if (
                b.confidence !==
                a.confidence
            ) {

                return (
                    b.confidence -
                    a.confidence
                );
            }

            return (
                b.probability -
                a.probability
            );
        }
    );

    const selected =
        candidates[0] ||
        null;

    if (selected) {

        console.log(

            `[MarketSelector] Selected: ${selected.label} | Probability: ${selected.probability}% | Confidence: ${selected.confidence}%`

        );
    }

    return selected;
}

// ==========================================
// SELECT MULTIPLE MARKETS
// ==========================================

export function selectBestMarkets(
    options = {}
) {

    const {

        probabilities = {},

        confidence = 60,

        validation = {}

    } = options;

    const qualityScore =
        clamp(

            validation?.qualityScore ??
            validation?.score ??
            70,

            0,
            100
        );

    let markets =
        generateCandidates({

            probabilities,

            confidence

        });

    if (
        markets.length === 0
    ) {

        const fallback =
            generateFallbackMarket({

                probabilities,

                confidence

            });

        markets =
            fallback
                ? [fallback]
                : [];
    }

    markets =
        markets.map(
            market => ({

                ...market,

                confidence:
                    round(

                        (
                            market.confidence *
                            0.80
                        ) +

                        (
                            qualityScore *
                            0.20
                        )

                    )

            })
        );

    markets.sort(
        (a, b) =>
            b.confidence -
            a.confidence
    );

    return {

        recommended:
            markets[0] ||
            null,

        alternatives:
            markets.slice(
                1,
                4
            ),

        totalMarkets:
            markets.length,

        generatedAt:
            new Date().toISOString()

    };
}

// ==========================================
// RANK MARKETS
// ==========================================

export function rankMarkets(
    markets = []
) {

    if (
        !Array.isArray(
            markets
        )
    ) {
        return [];
    }

    return [
        ...markets
    ].sort(
        (a, b) => {

            const confidenceDifference =
                safeNumber(
                    b?.confidence
                ) -
                safeNumber(
                    a?.confidence
                );

            if (
                confidenceDifference !== 0
            ) {
                return confidenceDifference;
            }

            return (
                safeNumber(
                    b?.probability
                ) -
                safeNumber(
                    a?.probability
                )
            );
        }
    );
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {

    selectBestMarket,

    selectBestMarkets,

    rankMarkets

};