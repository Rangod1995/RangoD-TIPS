```js
// ==========================================
// server/services/predictionNormalizer.js
// RangoD AI Engine V7 Enterprise
// Prediction Normalizer
// ==========================================

import mongoose from "mongoose";

// ==========================================
// Basic Helpers
// ==========================================

function toText(value, fallback = "") {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || fallback;
    }

    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    return String(value);
}

// ==========================================
// Safe Number
// ==========================================

function toNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

// ==========================================
// Confidence Number
// ==========================================

function clampConfidence(
    value,
    fallback = 65
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.max(
        50,
        Math.min(
            97,
            Math.round(number)
        )
    );
}

// ==========================================
// Confidence Object
// Supports both V7 objects and legacy numbers
// ==========================================

function normalizeConfidence(
    value,
    fallback = 65
) {
    // V7 confidence object
    if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        const confidence = clampConfidence(
            value.confidence,
            fallback
        );

        return {
            confidence,

            label:
                toText(
                    value.label,
                    confidence >= 92
                        ? "Elite"
                        : confidence >= 85
                            ? "Very High"
                            : confidence >= 75
                                ? "High"
                                : confidence >= 65
                                    ? "Medium"
                                    : "Low"
                ),

            risk:
                toText(
                    value.risk,
                    confidence >= 85
                        ? "Low"
                        : confidence >= 70
                            ? "Medium"
                            : "High"
                ),

            breakdown:
                value.breakdown &&
                typeof value.breakdown === "object" &&
                !Array.isArray(value.breakdown)
                    ? value.breakdown
                    : {}
        };
    }

    // Legacy numeric confidence
    const confidence =
        clampConfidence(
            value,
            fallback
        );

    return {
        confidence,

        label:
            confidence >= 92
                ? "Elite"
                : confidence >= 85
                    ? "Very High"
                    : confidence >= 75
                        ? "High"
                        : confidence >= 65
                            ? "Medium"
                            : "Low",

        risk:
            confidence >= 85
                ? "Low"
                : confidence >= 70
                    ? "Medium"
                    : "High",

        breakdown: {}
    };
}

// ==========================================
// Analysis
// ==========================================

function normalizeAnalysis(
    value,
    fallback = []
) {
    if (Array.isArray(value)) {
        return value
            .filter(Boolean)
            .map((item) =>
                toText(item)
            );
    }

    if (value) {
        return [
            toText(value)
        ];
    }

    return fallback;
}

// ==========================================
// Markets
// ==========================================

function normalizeMarkets(
    payload = {},
    fallbackMarket = "Home Win",
    fallbackConfidence = 65
) {
    const availableMarkets =
        Array.isArray(payload.markets)
            ? payload.markets
            : Array.isArray(payload.alternatives)
                ? payload.alternatives
                : [];

    if (availableMarkets.length) {
        return availableMarkets.map(
            (item) => ({
                market:
                    toText(
                        item?.market || item,
                        fallbackMarket
                    ),

                probability:
                    toNumber(
                        item?.probability,
                        0
                    ),

                confidence:
                    clampConfidence(
                        item?.confidence,
                        fallbackConfidence
                    )
            })
        );
    }

    if (
        payload.selectedMarketData &&
        typeof payload.selectedMarketData === "object"
    ) {
        return [
            {
                market:
                    toText(
                        payload
                            .selectedMarketData
                            .market ||
                        payload
                            .selectedMarketData
                            .selection ||
                        fallbackMarket,
                        fallbackMarket
                    ),

                probability:
                    toNumber(
                        payload
                            .selectedMarketData
                            .probability,
                        0
                    ),

                confidence:
                    clampConfidence(
                        payload
                            .selectedMarketData
                            .confidence,
                        fallbackConfidence
                    )
            }
        ];
    }

    return [
        {
            market:
                fallbackMarket,

            probability:
                toNumber(
                    payload.probabilities?.homeWin ??
                    payload.prediction
                        ?.probabilities
                        ?.homeWin,
                    0
                ),

            confidence:
                fallbackConfidence
        }
    ];
}

// ==========================================
// Prediction Object
// ==========================================

function normalizePredictionObject(
    payload = {},
    fallback = {}
) {
    const source =
        payload &&
        typeof payload === "object"
            ? payload
            : {};

    const fallbackPrediction =
        fallback &&
        typeof fallback === "object"
            ? fallback
            : {};

    const market =
        toText(
            source.market ||
            source.selectedMarket ||
            source.selection ||
            fallbackPrediction.market ||
            fallback.market ||
            source.prediction ||
            fallback.prediction ||
            "Home Win",
            "Home Win"
        );

    const confidence =
        normalizeConfidence(
            source.confidence ??
            fallbackPrediction.confidence ??
            fallback.confidence ??
            65,
            65
        );

    const expectedScore =
        toText(
            source.expectedScore ||
            source.scoreline ||
            source.score ||
            fallbackPrediction.expectedScore ||
            fallback.expectedScore ||
            "0-0",
            "0-0"
        );

    const reasoning =
        normalizeAnalysis(
            source.reasoning ||
            source.analysis ||
            fallbackPrediction.reasoning ||
            fallback.analysis,
            []
        );

    const probabilities =
        source.probabilities ||
        fallbackPrediction.probabilities ||
        fallback.probabilities ||
        {};

    return {
        market,

        selection:
            toText(
                source.selection ||
                market,
                market
            ),

        confidence,

        expectedScore,

        probabilities,

        reasoning
    };
}

// ==========================================
// Fixture ID Parser
// ==========================================

export function parseFixtureId(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (/^\d+$/.test(trimmed)) {
            const number =
                Number(trimmed);

            return Number.isFinite(number)
                ? number
                : null;
        }
    }

    return null;
}

// ==========================================
// Extract Fixture ID
// ==========================================

function extractFixtureId(
    payload = {}
) {
    const rawFixtureId =
        payload.fixtureId ??
        payload.fixture?.id ??
        payload.fixture?.fixture?.id ??
        payload.id ??
        null;

    return parseFixtureId(
        rawFixtureId
    );
}

// ==========================================
// Normalize Prediction Payload
// ==========================================

export function normalizePredictionPayload(
    input = {}
) {
    const payload =
        input &&
        typeof input === "object"
            ? input
            : {};

    const fixtureId =
        extractFixtureId(
            payload
        );

    // NEVER allow NaN,
    // undefined, null or fake IDs.
    if (
        fixtureId === null ||
        !Number.isFinite(fixtureId)
    ) {
        throw new Error("Invalid fixtureId: " + String(payload.fixtureId ??
                payload.fixture?.id ??
                payload.id ??
                "missing"
            ));
    }

    const predictionPayload =
        payload.prediction &&
        typeof payload.prediction === "object"
            ? payload.prediction
            : {};

    const normalizedPrediction =
        normalizePredictionObject(
            predictionPayload,
            {
                market:
                    payload.market ||
                    payload.selectedMarket ||
                    (
                        typeof payload.prediction === "string"
                            ? payload.prediction
                            : null
                    ),

                confidence:
                    payload.confidence,

                expectedScore:
                    payload.expectedScore ||
                    payload.scoreline,

                analysis:
                    payload.analysis,

                probabilities:
                    payload.probabilities
            }
        );

    // ==========================================
    // Preserve V7 Confidence Object
    // ==========================================

    const confidence =
        normalizeConfidence(
            payload.confidence ??
            normalizedPrediction.confidence,
            65
        );

    const expectedScore =
        toText(
            payload.expectedScore ||
            payload.scoreline ||
            normalizedPrediction.expectedScore ||
            "0-0",
            "0-0"
        );

    const analysis =
        normalizeAnalysis(
            payload.analysis ||
            predictionPayload.reasoning ||
            predictionPayload.analysis,
            []
        );

    const qualityScore =
        toNumber(
            payload.qualityScore ??
            payload.validation?.qualityScore ??
            predictionPayload.qualityScore,
            0
        );

    const markets =
        normalizeMarkets(
            payload,
            normalizedPrediction.market,
            confidence.confidence
        );

    const probabilities =
        payload.probabilities ||
        predictionPayload.probabilities ||
        {};

    const normalizedPayload = {
        fixtureId,

        homeTeam:
            toText(
                payload.homeTeam ||
                payload.home?.name ||
                payload.teams?.home?.name,
                "Unknown"
            ),

        awayTeam:
            toText(
                payload.awayTeam ||
                payload.away?.name ||
                payload.teams?.away?.name,
                "Unknown"
            ),

        league:
            toText(
                payload.league ||
                payload.leagueName ||
                payload.league?.name ||
                payload.competition?.name,
                "Unknown"
            ),

        country:
            toText(
                payload.country ||
                payload.league?.country ||
                "",
                ""
            ),

        season:
            payload.season ??
            payload.league?.season ??
            null,

        matchDate:
            payload.matchDate
                ? new Date(
                    payload.matchDate
                )
                : null,

        status:
            toText(
                payload.status,
                "pending"
            ),

        prediction: {
            ...normalizedPrediction,

            confidence,

            expectedScore,

            reasoning:
                analysis
        },

        confidence,

        expectedScore,

        probabilities,

        analysis,

        markets,

        qualityScore,

        isPremium:
            Boolean(
                payload.isPremium
            ),

        risk:
            toText(
                payload.risk ||
                payload.validation?.risk ||
                payload.metadata?.risk ||
                confidence.risk ||
                "Medium",
                "Medium"
            ),

        metadata:
            payload.metadata &&
            typeof payload.metadata === "object"
                ? payload.metadata
                : {},

        createdAt:
            payload.createdAt
                ? new Date(
                    payload.createdAt
                )
                : undefined,

        updatedAt:
            payload.updatedAt
                ? new Date(
                    payload.updatedAt
                )
                : undefined
    };

    // ==========================================
    // Final Fixture ID Safety Check
    // ==========================================

    if (
        !Number.isFinite(
            normalizedPayload.fixtureId
        )
    ) {
        throw new Error(
            "Prediction normalization produced an invalid fixtureId"
        );
    }

    return normalizedPayload;
}

// ==========================================
// Validate Prediction Payload
// ==========================================

export function validatePredictionPayload(
    payload = {},
    options = {}
) {
    try {
        const normalized =
            normalizePredictionPayload(
                payload
            );

        if (
            options.existingFixtureIds
                ?.includes(
                    normalized.fixtureId
                )
        ) {
            return {
                ok: false,

                error:
                    "fixtureId " + String(normalized.fixtureId) + " already exists"
            };
        }

        return {
            ok: true,

            payload:
                normalized
        };

    } catch (error) {
        return {
            ok: false,

            error:
                error.message ||
                "Prediction payload is invalid"
        };
    }
}

// ==========================================
// Build Lookup Filter
// ==========================================

export function buildPredictionLookupFilter(
    id
) {
    if (
        id === null ||
        id === undefined ||
        id === ""
    ) {
        return null;
    }

    if (
        typeof id === "number" &&
        Number.isFinite(id)
    ) {
        return {
            fixtureId:
                id
        };
    }

    if (
        typeof id === "string"
    ) {
        const trimmed =
            id.trim();

        if (
            /^\d+$/.test(
                trimmed
            )
        ) {
            return {
                fixtureId:
                    Number(trimmed)
            };
        }

        if (
            mongoose.Types.ObjectId
                .isValid(trimmed)
        ) {
            return {
                _id:
                    trimmed
            };
        }
    }

    if (
        mongoose.Types.ObjectId
            .isValid(id)
    ) {
        return {
            _id:
                id
        };
    }

    return null;
}

// ==========================================
// Migrate Prediction Document
// ==========================================

export function migratePredictionDocument(
    document = {}
) {
    const source =
        document &&
        typeof document === "object"
            ? document
            : {};

    const fixtureId =
        parseFixtureId(
            source.fixtureId ??
            source.fixture?.id ??
            source.id
        );

    // A migration must NEVER invent
    // a fixture ID.
    if (
        fixtureId === null ||
        !Number.isFinite(fixtureId)
    ) {
        throw new Error(
            "Cannot migrate prediction document: valid fixtureId is missing"
        );
    }

    return {
        ...normalizePredictionPayload({
            ...source,
            fixtureId
        }),

        _id:
            source._id
    };
}

// ==========================================
// Default Export
// ==========================================

export default {
    normalizePredictionPayload,

    validatePredictionPayload,

    buildPredictionLookupFilter,

    migratePredictionDocument
};
```


