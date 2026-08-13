
// ==========================================
// server/services/footballService.js
// RangoD TIPS V7 Enterprise
// Football API Service
// ==========================================

import axios from "axios";

import { config } from "../config/env.js";

import { generatePrediction } from "./predictionEngine.js";

import {
    getCache,
    setCache
} from "./cacheService.js";

// ==========================================
// API CLIENT
// ==========================================

const api = axios.create({
    baseURL: config.footballApiUrl,

    timeout: 15000,

    headers: {
        "x-apisports-key": config.footballApiKey,
        Accept: "application/json"
    }
});

// ==========================================
// LIVE STATUS CODES
// API-FOOTBALL STATUS SHORT CODES
// ==========================================

const LIVE_STATUSES = new Set([
    "1H",
    "2H",
    "HT",
    "ET",
    "P",
    "BT",
    "LIVE",
    "INT",
    "SUSP",
    "SUSPENDED",
    "BREAK",
    "2H_ET",
    "PEN"
]);

// ==========================================
// STATUS GROUPS
// ==========================================

const FINISHED_STATUSES = new Set([
    "FT",
    "AET",
    "PEN",
    "CANC",
    "PST",
    "ABD",
    "AWD",
    "WO"
]);

// ==========================================
// SAFE NUMBER
// ==========================================

function safeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

// ==========================================
// TODAY
// ==========================================

function getTodayDate() {
    return new Date()
        .toISOString()
        .split("T")[0];
}

// ==========================================
// PARSE FIXTURE ID
// ==========================================

function parseFixtureId(fixture) {
    if (!fixture) {
        return null;
    }

    const rawId =
        fixture.fixtureId ??
        fixture.fixture?.id ??
        fixture.id;

    if (
        rawId === null ||
        rawId === undefined ||
        rawId === ""
    ) {
        return null;
    }

    const number = Number(rawId);

    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {
        return null;
    }

    return number;
}

// ==========================================
// GET TEAM NAME
// ==========================================

function getHomeTeamName(fixture) {
    return (
        fixture?.homeTeam ??
        fixture?.teams?.home?.name ??
        fixture?.home?.name ??
        null
    );
}

function getAwayTeamName(fixture) {
    return (
        fixture?.awayTeam ??
        fixture?.teams?.away?.name ??
        fixture?.away?.name ??
        null
    );
}

// ==========================================
// GET STATUS
// ==========================================

function getFixtureStatus(fixture) {
    return String(
        fixture?.fixture?.status?.short ??
        fixture?.status?.short ??
        fixture?.statusShort ??
        ""
    )
        .trim()
        .toUpperCase();
}

// ==========================================
// GET STATUS LONG
// ==========================================

function getFixtureStatusLong(fixture) {
    return (
        fixture?.fixture?.status?.long ??
        fixture?.status?.long ??
        ""
    );
}

// ==========================================
// VALIDATE FIXTURE
// ==========================================

function validateFixture(fixture) {
    if (
        !fixture ||
        typeof fixture !== "object"
    ) {
        return false;
    }

    const fixtureId =
        parseFixtureId(fixture);

    if (
        !Number.isFinite(fixtureId) ||
        fixtureId <= 0
    ) {
        return false;
    }

    const homeTeam =
        getHomeTeamName(fixture);

    const awayTeam =
        getAwayTeamName(fixture);

    if (
        !homeTeam ||
        !awayTeam
    ) {
        return false;
    }

    return true;
}

// ==========================================
// IS LIVE
// ==========================================

function isLiveFixture(fixture) {
    const status =
        getFixtureStatus(fixture);

    if (!status) {
        return false;
    }

    if (
        FINISHED_STATUSES.has(status)
    ) {
        return false;
    }

    return LIVE_STATUSES.has(status);
}

// ==========================================
// NORMALIZE FIXTURE
// ==========================================
//
// Keeps the original API-Football object,
// while adding predictable top-level fields.
// This makes the frontend and other services
// less dependent on API-Football's nesting.
//

function normalizeFixture(fixture) {
    if (!validateFixture(fixture)) {
        return null;
    }

    const fixtureId =
        parseFixtureId(fixture);

    const homeTeam =
        getHomeTeamName(fixture);

    const awayTeam =
        getAwayTeamName(fixture);

    const league =
        fixture?.league?.name ??
        fixture?.league ??
        "Unknown League";

    const status =
        getFixtureStatus(fixture);

    const statusLong =
        getFixtureStatusLong(fixture);

    const matchDate =
        fixture?.fixture?.date ??
        fixture?.matchDate ??
        null;

    const homeTeamId =
        fixture?.homeTeamId ??
        fixture?.teams?.home?.id ??
        null;

    const awayTeamId =
        fixture?.awayTeamId ??
        fixture?.teams?.away?.id ??
        null;

    return {
        ...fixture,

        fixtureId,

        homeTeam,

        awayTeam,

        league,

        homeTeamId,

        awayTeamId,

        matchDate,

        status,

        statusLong,

        isLive: LIVE_STATUSES.has(status)
    };
}

// ==========================================
// GET FIXTURES
// ==========================================

export async function getFixtures(date) {
    const requestedDate =
        date || getTodayDate();

    const cacheKey =
        `fixtures-${requestedDate}`;

    const cached =
        getCache(cacheKey);

    if (Array.isArray(cached)) {
        console.log(
            `[FootballService] Using cached fixtures for ${requestedDate}: ${cached.length}`
        );

        return cached;
    }

    try {
        const response =
            await api.get(
                "/fixtures",
                {
                    params: {
                        date: requestedDate
                    }
                }
            );

        const fixtures =
            Array.isArray(
                response?.data?.response
            )
                ? response.data.response
                : [];

        const validFixtures =
            fixtures
                .map(normalizeFixture)
                .filter(Boolean);

        console.log(
            `[FootballService] Fixtures ${requestedDate}: ${validFixtures.length}`
        );

        setCache(
            cacheKey,
            validFixtures,
            2 * 60 * 1000
        );

        return validFixtures;

    } catch (error) {
        console.error(
            "[FootballService] Fixtures API Error:",
            error.response?.data ||
            error.message
        );

        return [];
    }
}

// ==========================================
// GET LIVE MATCHES
// ==========================================
//
// Strategy:
//
// 1. Use API-Football live=all.
// 2. If it returns live fixtures, use them.
// 3. If it returns [] OR fails, query today's
//    fixtures and filter by live status.
// 4. Never cache an empty live result for long.
//
// This prevents a temporary empty API response
// from making the frontend permanently show
// "No Live Matches."
//

export async function getLiveMatches() {
    const cacheKey =
        "live-matches";

    const cached =
        getCache(cacheKey);

    // Only use a cached LIVE result when it
    // actually contains matches.
    if (
        Array.isArray(cached) &&
        cached.length > 0
    ) {
        console.log(
            `[FootballService] Returning ${cached.length} cached live matches.`
        );

        return cached;
    }

    // ======================================
    // FIRST ATTEMPT:
    // API-FOOTBALL LIVE ENDPOINT
    // ======================================

    try {
        const response =
            await api.get(
                "/fixtures",
                {
                    params: {
                        live: "all"
                    }
                }
            );

        const fixtures =
            Array.isArray(
                response?.data?.response
            )
                ? response.data.response
                : [];

        const validLiveFixtures =
            fixtures
                .map(normalizeFixture)
                .filter(Boolean)
                .filter(isLiveFixture);

        console.log(
            `[FootballService] API live endpoint: ${validLiveFixtures.length} live matches.`
        );

        if (
            validLiveFixtures.length > 0
        ) {
            setCache(
                cacheKey,
                validLiveFixtures,
                15 * 1000
            );

            return validLiveFixtures;
        }

        console.warn(
            "[FootballService] API live endpoint returned no live matches. Trying today's fixtures fallback..."
        );

    } catch (error) {
        console.warn(
            "[FootballService] Live endpoint failed:",
            error.response?.data ||
            error.message
        );
    }

    // ======================================
    // SECOND ATTEMPT:
    // TODAY'S FIXTURES
    // ======================================

    try {
        const today =
            getTodayDate();

        const todayFixtures =
            await getFixtures(today);

        const liveFixtures =
            todayFixtures
                .filter(isLiveFixture);

        console.log(
            `[FootballService] Today's fixture fallback: ${liveFixtures.length} live matches.`
        );

        if (
            liveFixtures.length > 0
        ) {
            setCache(
                cacheKey,
                liveFixtures,
                15 * 1000
            );

            return liveFixtures;
        }

    } catch (error) {
        console.error(
            "[FootballService] Live fallback failed:",
            error.message
        );
    }

    // ======================================
    // NO LIVE MATCHES
    // ======================================

    console.log(
        "[FootballService] No live matches currently detected."
    );

    // Keep empty cache very short so that a
    // match becoming live is detected quickly.
    setCache(
        cacheKey,
        [],
        5 * 1000
    );

    return [];
}

// ==========================================
// TODAY'S MATCHES
// ==========================================

export async function getTodayMatches() {
    const today =
        getTodayDate();

    const fixtures =
        await getFixtures(today);

    return fixtures.filter(
        validateFixture
    );
}

// ==========================================
// SINGLE FIXTURE
// ==========================================

export async function getFixtureById(
    fixtureId
) {
    const normalizedFixtureId =
        Number(fixtureId);

    if (
        !Number.isFinite(
            normalizedFixtureId
        ) ||
        normalizedFixtureId <= 0
    ) {
        console.error(
            "[FootballService] Invalid fixture ID:",
            fixtureId
        );

        return null;
    }

    // ======================================
    // CHECK TODAY'S CACHE FIRST
    // ======================================

    try {
        const today =
            getTodayDate();

        const cachedFixtures =
            getCache(
                `fixtures-${today}`
            );

        if (
            Array.isArray(
                cachedFixtures
            )
        ) {
            const cachedFixture =
                cachedFixtures.find(
                    fixture =>
                        Number(
                            fixture.fixtureId
                        ) ===
                        normalizedFixtureId
                );

            if (cachedFixture) {
                return cachedFixture;
            }
        }
    } catch (error) {
        console.warn(
            "[FootballService] Fixture cache lookup failed:",
            error.message
        );
    }

    // ======================================
    // API LOOKUP
    // ======================================

    try {
        const response =
            await api.get(
                "/fixtures",
                {
                    params: {
                        id:
                            normalizedFixtureId
                    }
                }
            );

        const fixture =
            response?.data?.response?.[0];

        if (!fixture) {
            return null;
        }

        return normalizeFixture(
            fixture
        );

    } catch (error) {
        console.error(
            "[FootballService] Fixture lookup error:",
            error.response?.data ||
            error.message
        );

        return null;
    }
}

// ==========================================
// ENRICH FIXTURE WITH AI
// ==========================================

export async function enrichFixturePrediction(
    fixture
) {
    if (!fixture) {
        return null;
    }

    const fixtureId =
        parseFixtureId(fixture);

    if (
        !Number.isFinite(
            fixtureId
        ) ||
        fixtureId <= 0
    ) {
        throw new Error(
            "Cannot generate prediction: invalid fixture ID."
        );
    }

    const homeTeam =
        getHomeTeamName(fixture);

    const awayTeam =
        getAwayTeamName(fixture);

    if (
        !homeTeam ||
        !awayTeam
    ) {
        throw new Error(
            `Fixture ${fixtureId} is missing team information.`
        );
    }

    const prediction =
        await generatePrediction({
            fixtureId,

            homeTeam,

            awayTeam,

            league:
                fixture?.league?.name ??
                fixture?.league ??
                "Unknown League",

            homeTeamId:
                fixture?.homeTeamId ??
                fixture?.teams?.home?.id ??
                null,

            awayTeamId:
                fixture?.awayTeamId ??
                fixture?.teams?.away?.id ??
                null,

            leagueStrength:
                safeNumber(
                    fixture?.league?.strength ??
                    fixture?.leagueStrength,
                    50
                ),

            matchDate:
                fixture?.fixture?.date ??
                fixture?.matchDate ??
                null
        });

    return {
        ...fixture,

        fixtureId,

        aiPrediction:
            prediction
    };
}

// ==========================================
// TODAY'S AI PREDICTIONS
// ==========================================

export async function getTodayPredictions() {
    const fixtures =
        await getTodayMatches();

    const predictions = [];

    for (
        const fixture
        of fixtures
    ) {
        const fixtureId =
            parseFixtureId(fixture);

        if (
            !Number.isFinite(
                fixtureId
            )
        ) {
            continue;
        }

        try {
            const enriched =
                await enrichFixturePrediction(
                    fixture
                );

            predictions.push(
                enriched
            );

        } catch (error) {
            console.error(
                `[FootballService] Prediction failed for fixture ${fixtureId}:`,
                error.message
            );

            predictions.push({
                ...fixture,

                fixtureId,

                error:
                    error.message
            });
        }
    }

    return predictions;
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    getFixtures,

    getTodayMatches,

    getFixtureById,

    getLiveMatches,

    enrichFixturePrediction,

    getTodayPredictions
};

