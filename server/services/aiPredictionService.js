```js
// ==========================================
// server/services/aiPredictionService.js
// RangoD AI Engine V7 Enterprise
// AI Prediction Service
// ==========================================

import {
    generatePrediction
} from "./predictionEngine.js";

// ==========================================
// Safe Number
// ==========================================

function safeNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

// ==========================================
// Normalize + Validate Fixture ID
// ==========================================

function normalizeFixtureId(fixture = {}) {

    const rawFixtureId =
        fixture.fixtureId ??
        fixture.fixture?.id ??
        fixture.id ??
        null;

    const fixtureId =
        Number(rawFixtureId);

    if (!Number.isFinite(fixtureId)) {

        throw new Error("Invalid fixture ID: " + String(rawFixtureId));

    }

    return fixtureId;
}

// ==========================================
// Normalize Fixture
// ==========================================

function normalizeFixture(fixture = {}) {

    if (!fixture || typeof fixture !== "object") {

        throw new Error(
            "Invalid fixture: fixture must be an object"
        );

    }

    const fixtureId =
        normalizeFixtureId(
            fixture
        );

    return {

        fixtureId,

        homeTeam:
            fixture.homeTeam ??
            fixture.teams?.home?.name ??
            fixture.home?.name ??
            "Unknown Home",

        awayTeam:
            fixture.awayTeam ??
            fixture.teams?.away?.name ??
            fixture.away?.name ??
            "Unknown Away",

        league:
            fixture.league?.name ??
            fixture.league ??
            fixture.competition?.name ??
            "Unknown League",

        homeTeamId:
            fixture.homeTeamId ??
            fixture.teams?.home?.id ??
            fixture.home?.id ??
            null,

        awayTeamId:
            fixture.awayTeamId ??
            fixture.teams?.away?.id ??
            fixture.away?.id ??
            null,

        leagueId:
            fixture.leagueId ??
            fixture.league?.id ??
            null,

        matchDate:
            fixture.matchDate ??
            fixture.fixture?.date ??
            null,

        leagueStrength:
            safeNumber(
                fixture.leagueStrength,
                50
            ),

        originalFixture:
            fixture
    };
}

// ==========================================
// Single AI Prediction
// ==========================================

export async function createAIPrediction(
    fixture
) {

    const normalized =
        normalizeFixture(
            fixture
        );

    const prediction =
        await generatePrediction(
            normalized
        );

    return {

        ...prediction,

        fixtureId:
            normalized.fixtureId,

        homeTeam:
            normalized.homeTeam,

        awayTeam:
            normalized.awayTeam,

        league:
            normalized.league,

        ai: {

            engine:
                "RangoD AI Engine V7 Enterprise",

            generated:
                new Date().toISOString()

        }

    };
}

// ==========================================
// Multiple Predictions
// ==========================================

export async function createMultipleAIPredictions(
    fixtures = []
) {

    const results = [];

    if (!Array.isArray(fixtures)) {

        throw new Error(
            "Fixtures must be an array"
        );

    }

    for (const fixture of fixtures) {

        try {

            const prediction =
                await createAIPrediction(
                    fixture
                );

            results.push(
                prediction
            );

        } catch (error) {

            let fixtureId = null;

            try {

                fixtureId =
                    normalizeFixtureId(
                        fixture
                    );

            } catch {
                fixtureId = null;
            }

            results.push({

                fixtureId,

                error:
                    error.message

            });

        }

    }

    return results;
}

// ==========================================
// Prediction Quality Check
// ==========================================

export function validateAIPrediction(
    prediction = {}
) {

    const checks = {

        hasScore:
            Boolean(
                prediction.prediction?.score ||
                prediction.prediction?.expectedScore
            ),

        hasMarket:
            Boolean(
                prediction.prediction?.recommendedMarket ||
                prediction.prediction?.market ||
                prediction.market
            ),

        hasConfidence:
            Boolean(
                prediction.confidence !== undefined &&
                prediction.confidence !== null
            )

    };

    const passed =
        Object.values(checks)
            .filter(Boolean)
            .length;

    return {

        valid:
            passed === 3,

        qualityScore:
            Math.round(
                (passed / 3) * 100
            ),

        checks

    };
}

// ==========================================
// Default Export
// ==========================================

export default {

    createAIPrediction,

    createMultipleAIPredictions,

    validateAIPrediction

};
```

