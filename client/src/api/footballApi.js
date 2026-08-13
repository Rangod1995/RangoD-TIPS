// ==========================================
// client/src/api/footballApi.js
// RangoD TIPS V7 Enterprise
// Football API Client
// ==========================================

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// ==========================================
// HELPERS
// ==========================================

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}


// ==========================================
// Extract matches from ANY supported response
// ==========================================

function extractMatches(result) {

    if (Array.isArray(result)) {
        return result;
    }

    if (!isObject(result)) {
        return [];
    }

    // Most common
    if (Array.isArray(result.matches)) {
        return result.matches;
    }

    // API style
    if (Array.isArray(result.response)) {
        return result.response;
    }

    // Data
    if (Array.isArray(result.data)) {
        return result.data;
    }

    // Fixtures
    if (Array.isArray(result.fixtures)) {
        return result.fixtures;
    }

    // Predictions
    if (Array.isArray(result.predictions)) {
        return result.predictions;
    }

    // Nested data
    if (
        isObject(result.data) &&
        Array.isArray(result.data.matches)
    ) {
        return result.data.matches;
    }

    // Nested response
    if (
        isObject(result.response) &&
        Array.isArray(result.response.matches)
    ) {
        return result.response.matches;
    }

    return [];
}


// ==========================================
// Generic Request Helper
// ==========================================

async function request(endpoint) {

    const url =
        `${API_URL}${endpoint}`;

    console.log(
        `[FootballAPI] GET ${url}`
    );

    try {

        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json",
                    },

                    cache: "no-store",
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType
                .toLowerCase()
                .includes("application/json")
        ) {

            const text =
                await response.text();

            console.error(
                `[FootballAPI] Invalid response from ${endpoint}:`,
                text
            );

            throw new Error(
                `Server returned an invalid response (${response.status}).`
            );
        }

        const result =
            await response.json();

        console.log(
            `[FootballAPI] ${endpoint} response:`,
            result
        );

        if (!response.ok) {

            throw new Error(
                result?.message ||
                result?.error ||
                `Football request failed (${response.status}).`
            );
        }

        return result;

    } catch (error) {

        console.error(
            `[FootballAPI] Request failed: ${endpoint}`,
            error
        );

        if (
            error?.name ===
            "TypeError"
        ) {

            throw new Error(
                "Unable to connect to the football server."
            );
        }

        if (
            error?.message?.includes(
                "getaddrinfo"
            ) ||
            error?.message?.includes(
                "ENOTFOUND"
            ) ||
            error?.message?.includes(
                "MongoDB"
            ) ||
            error?.message?.includes(
                "ECONNREFUSED"
            )
        ) {

            throw new Error(
                "Football data is temporarily unavailable. Please try again."
            );
        }

        throw error;
    }
}


// ==========================================
// Normalize fixture
// ==========================================

function normalizeMatch(match) {

    if (!match) {
        return null;
    }

    // Already normal fixture
    if (
        match.fixture ||
        match.teams ||
        match.goals
    ) {
        return match;
    }

    // Some backend responses may wrap fixture
    if (match.data) {
        return match.data;
    }

    return match;
}


// ==========================================
// Determine status
// ==========================================

function getStatusCode(match) {

    return String(
        match?.fixture?.status?.short ||
        match?.status?.short ||
        match?.status ||
        "NS"
    ).toUpperCase();
}


// ==========================================
// Determine if fixture is live
// ==========================================

function isLive(match) {

    const status =
        getStatusCode(match);

    return [
        "1H",
        "2H",
        "HT",
        "ET",
        "P",
        "BT",
        "LIVE",
        "INT",
        "SUSP",
        "ABT",
        "ABD",
    ].includes(status);
}


// ==========================================
// LIVE MATCHES
// ==========================================

export async function getLiveMatches() {

    console.log(
        "[FootballAPI] Loading live matches..."
    );

    // ======================================
    // FIRST ATTEMPT
    // Dedicated live endpoint
    // ======================================

    try {

        const result =
            await request(
                "/matches/live"
            );

        const matches =
            extractMatches(result)
                .map(normalizeMatch)
                .filter(Boolean);

        console.log(
            `[FootballAPI] /matches/live returned ${matches.length} matches`
        );

        if (matches.length > 0) {

            const liveMatches =
                matches.filter(
                    isLive
                );

            console.log(
                `[FootballAPI] ${liveMatches.length} confirmed live matches`
            );

            // If backend explicitly returned live
            // matches, return them.
            if (
                liveMatches.length > 0
            ) {
                return liveMatches;
            }

            // Some backend implementations
            // don't expose the status correctly.
            return matches;
        }

    } catch (error) {

        console.warn(
            "[FootballAPI] Dedicated live endpoint failed:",
            error?.message
        );
    }


    // ======================================
    // FALLBACK
    // Load today's matches and filter live
    // ======================================

    console.log(
        "[FootballAPI] Falling back to today's matches..."
    );

    try {

        const result =
            await request(
                "/matches"
            );

        const matches =
            extractMatches(result)
                .map(normalizeMatch)
                .filter(Boolean);

        console.log(
            `[FootballAPI] /matches returned ${matches.length} matches`
        );

        const liveMatches =
            matches.filter(
                isLive
            );

        console.log(
            `[FootballAPI] Found ${liveMatches.length} live matches from today's fixtures`
        );

        return liveMatches;

    } catch (error) {

        console.error(
            "[FootballAPI] Unable to load live matches:",
            error
        );

        throw new Error(
            error?.message ||
            "Unable to load live football matches."
        );
    }
}


// ==========================================
// TODAY'S MATCHES
// ==========================================

export async function getTodayMatches() {

    console.log(
        "[FootballAPI] Loading today's matches..."
    );

    const result =
        await request(
            "/matches"
        );

    const matches =
        extractMatches(result)
            .map(normalizeMatch)
            .filter(Boolean);

    console.log(
        `[FootballAPI] Today's matches: ${matches.length}`
    );

    return matches;
}


// ==========================================
// COMPETITIONS
// ==========================================

export async function getCompetitions() {

    const matches =
        await getTodayMatches();

    const leagueMap =
        new Map();

    matches.forEach(
        (match) => {

            const leagueName =
                match?.league?.name ||
                match?.competition?.name ||
                match?.league ||
                "Unknown League";

            const country =
                match?.league?.country ||
                match?.competition?.country ||
                "";

            if (
                !leagueMap.has(
                    leagueName
                )
            ) {

                leagueMap.set(
                    leagueName,
                    {
                        name:
                            leagueName,

                        country:
                            country,

                        matchesToday:
                            0,
                    }
                );
            }

            const league =
                leagueMap.get(
                    leagueName
                );

            league.matchesToday += 1;
        }
    );

    return Array.from(
        leagueMap.values()
    );
}


// ==========================================
// HEALTH CHECK
// ==========================================

export async function getApiHealth() {

    return request(
        "/health"
    );
}


// ==========================================
// OPTIONAL DEBUG FUNCTION
// ==========================================

export async function debugFootballEndpoints() {

    const results = {};

    // ------------------------------
    // Live
    // ------------------------------

    try {

        const live =
            await request(
                "/matches/live"
            );

        results.live = {
            success: true,
            matches:
                extractMatches(live),
            raw:
                live,
        };

    } catch (error) {

        results.live = {
            success: false,
            error:
                error?.message,
        };
    }


    // ------------------------------
    // Today
    // ------------------------------

    try {

        const today =
            await request(
                "/matches"
            );

        results.today = {
            success: true,
            matches:
                extractMatches(today),
            raw:
                today,
        };

    } catch (error) {

        results.today = {
            success: false,
            error:
                error?.message,
        };
    }


    console.log(
        "[FootballAPI] DEBUG RESULTS:",
        results
    );

    return results;
}