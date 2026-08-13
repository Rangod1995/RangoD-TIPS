// ==========================================
// client/src/components/LiveMatches.jsx
// RangoD TIPS V7 Enterprise
// Live & Upcoming Matches
// Stable Live Match Display
// ==========================================

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    getLiveMatches,
} from "../api/footballApi";

import "./LiveMatches.css";

// ==========================================
// LIVE STATUS CODES
// ==========================================

const LIVE_STATUSES = new Set([
    "1H",
    "2H",
    "HT",
    "ET",
    "P",
    "BT",
    "LIVE",
]);

// ==========================================
// STATUS
// ==========================================

function getStatusCode(match) {
    return String(
        match?.fixture?.status?.short ||
        match?.status?.short ||
        match?.fixture?.status ||
        match?.status ||
        ""
    ).toUpperCase();
}

function isLiveMatch(match) {
    return LIVE_STATUSES.has(
        getStatusCode(match)
    );
}

// ==========================================
// SAFE ARRAY EXTRACTION
// ==========================================

function extractMatches(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.matches)) {
        return result.matches;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result?.fixtures)) {
        return result.fixtures;
    }

    if (Array.isArray(result?.response)) {
        return result.response;
    }

    return [];
}

// ==========================================
// DATE / TIME
// ==========================================

function formatMatchTime(dateValue) {
    if (!dateValue) {
        return "TIME TBD";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "TIME TBD";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function formatMatchDate(dateValue) {
    if (!dateValue) {
        return "DATE TBD";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "DATE TBD";
    }

    return date.toLocaleDateString(
        [],
        {
            weekday: "short",
            day: "numeric",
            month: "short",
        }
    );
}

// ==========================================
// LIVE MINUTE
// ==========================================

function getMinuteLabel(match) {
    const status =
        match?.fixture?.status || {};

    const code =
        getStatusCode(match);

    if (code === "HT") {
        return "HALF TIME";
    }

    if (
        code === "FT" ||
        code === "AET" ||
        code === "PEN"
    ) {
        return code;
    }

    const elapsed =
        Number(status?.elapsed);

    if (Number.isFinite(elapsed)) {
        if (code === "ET") {
            return `${elapsed}' ET`;
        }

        return `${elapsed}'`;
    }

    if (
        code === "NS" ||
        code === "TBD"
    ) {
        return "NOT STARTED";
    }

    return code || "LIVE";
}

// ==========================================
// PREDICTION
// ==========================================

function getPrediction(match) {
    const ai =
        match?.aiPrediction ||
        match?.prediction ||
        {};

    const nestedPrediction =
        ai?.prediction &&
        typeof ai.prediction === "object"
            ? ai.prediction
            : {};

    return (
        nestedPrediction?.selection ||
        nestedPrediction?.market ||
        nestedPrediction?.pick ||
        nestedPrediction?.tip ||
        ai?.selection ||
        ai?.market ||
        ai?.pick ||
        ai?.tip ||
        "AI ANALYSIS"
    );
}

// ==========================================
// CONFIDENCE
// ==========================================

function getConfidence(match) {
    const ai =
        match?.aiPrediction ||
        match?.prediction ||
        {};

    const nestedPrediction =
        ai?.prediction &&
        typeof ai.prediction === "object"
            ? ai.prediction
            : {};

    const raw =
        nestedPrediction?.confidence ??
        ai?.confidence ??
        match?.confidence;

    if (
        raw &&
        typeof raw === "object"
    ) {
        const value =
            Number(
                raw.confidence ??
                raw.score ??
                raw.value
            );

        return Number.isFinite(value)
            ? Math.round(
                Math.max(
                    0,
                    Math.min(100, value)
                )
            )
            : null;
    }

    const value =
        Number(raw);

    return Number.isFinite(value)
        ? Math.round(
            Math.max(
                0,
                Math.min(100, value)
            )
        )
        : null;
}

// ==========================================
// MATCH CARD
// ==========================================

function MatchCard({
    match,
    navigate,
}) {
    const fixture =
        match?.fixture || {};

    const teams =
        match?.teams || {};

    const goals =
        match?.goals || {};

    const league =
        match?.league || {};

    const live =
        isLiveMatch(match);

    const statusCode =
        getStatusCode(match);

    const homeName =
        teams?.home?.name ||
        match?.homeTeam ||
        "Home Team";

    const awayName =
        teams?.away?.name ||
        match?.awayTeam ||
        "Away Team";

    const homeLogo =
        teams?.home?.logo ||
        match?.homeLogo ||
        null;

    const awayLogo =
        teams?.away?.logo ||
        match?.awayLogo ||
        null;

    const homeScore =
        goals?.home ??
        match?.homeScore ??
        0;

    const awayScore =
        goals?.away ??
        match?.awayScore ??
        0;

    const confidence =
        getConfidence(match);

    const prediction =
        getPrediction(match);

    const fixtureId =
        fixture?.id ||
        match?.fixtureId ||
        match?.id ||
        match?._id;

    const dateValue =
        fixture?.date ||
        match?.matchDate ||
        match?.date;

    const time =
        formatMatchTime(dateValue);

    const date =
        formatMatchDate(dateValue);

    const minute =
        getMinuteLabel(match);

    const statusText =
        live
            ? "LIVE NOW"
            : statusCode === "FT"
                ? "FULL TIME"
                : statusCode === "NS"
                    ? "UPCOMING"
                    : statusCode || "UPCOMING";

    function openAnalysis() {
        if (!fixtureId) {
            return;
        }

        navigate(
            `/predictions/${fixtureId}`
        );
    }

    return (
        <article
            className={`match-card ${
                live
                    ? "match-live"
                    : "match-upcoming"
            }`}
        >

            {/* ==================================
                TOP
            ================================== */}

            <div className="match-card-top">

                <div className="league-info">

                    <span className="league-name">
                        {league?.name ||
                            match?.league ||
                            "Unknown League"}
                    </span>

                    {league?.country && (
                        <span className="league-country">
                            {league.country}
                        </span>
                    )}

                </div>

                <div
                    className={`match-status ${
                        live
                            ? "status-live"
                            : "status-upcoming"
                    }`}
                >

                    {live && (
                        <span className="live-dot" />
                    )}

                    {statusText}

                </div>

            </div>

            {/* ==================================
                DATE
            ================================== */}

            <div className="match-meta">

                <span>
                    {date}
                </span>

                <span className="meta-divider">
                    •
                </span>

                <span>
                    {time}
                </span>

            </div>

            {/* ==================================
                TEAMS
            ================================== */}

            <div className="teams-section">

                <div className="team-block">

                    {homeLogo ? (
                        <img
                            src={homeLogo}
                            alt={homeName}
                            className="team-logo"
                            loading="lazy"
                            onError={(event) => {
                                event.currentTarget.style.display =
                                    "none";
                            }}
                        />
                    ) : (
                        <div className="team-logo-placeholder">
                            ⚽
                        </div>
                    )}

                    <h3>
                        {homeName}
                    </h3>

                    <span className="team-label">
                        HOME
                    </span>

                </div>

                <div className="score-section">

                    <div className="match-time-label">
                        {live
                            ? "MATCH TIME"
                            : "KICK-OFF"}
                    </div>

                    <div className="score">

                        {live
                            ? `${homeScore} - ${awayScore}`
                            : "VS"}

                    </div>

                    <div
                        className={`minute-display ${
                            live
                                ? "minute-live"
                                : ""
                        }`}
                    >
                        {minute}
                    </div>

                </div>

                <div className="team-block">

                    {awayLogo ? (
                        <img
                            src={awayLogo}
                            alt={awayName}
                            className="team-logo"
                            loading="lazy"
                            onError={(event) => {
                                event.currentTarget.style.display =
                                    "none";
                            }}
                        />
                    ) : (
                        <div className="team-logo-placeholder">
                            ⚽
                        </div>
                    )}

                    <h3>
                        {awayName}
                    </h3>

                    <span className="team-label">
                        AWAY
                    </span>

                </div>

            </div>

            {/* ==================================
                AI
            ================================== */}

            <div className="match-analysis">

                <div className="analysis-row">

                    <span>
                        AI Prediction
                    </span>

                    <strong>
                        {prediction}
                    </strong>

                </div>

                {confidence !== null && (
                    <div className="analysis-row">

                        <span>
                            Confidence
                        </span>

                        <strong className="confidence-value">
                            {confidence}%
                        </strong>

                    </div>
                )}

            </div>

            {/* ==================================
                BUTTON
            ================================== */}

            <button
                type="button"
                className="analysis-btn"
                onClick={openAnalysis}
                disabled={!fixtureId}
            >
                View Full AI Analysis
                <span>→</span>
            </button>

        </article>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

function LiveMatches() {
    const navigate =
        useNavigate();

    const [matches, setMatches] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);

    const [lastUpdated, setLastUpdated] =
        useState(null);

    // ==========================================
    // LOAD MATCHES
    // ==========================================

    const loadMatches =
        useCallback(
            async (initial = false) => {
                try {
                    if (initial) {
                        setLoading(true);
                    }

                    setError(null);

                    console.log(
                        "[LiveMatches] Fetching live matches..."
                    );

                    const result =
                        await getLiveMatches();

                    const incomingMatches =
                        extractMatches(result);

                    console.log(
                        "[LiveMatches] API result:",
                        result
                    );

                    console.log(
                        "[LiveMatches] Matches received:",
                        incomingMatches.length
                    );

                    /*
                     * IMPORTANT:
                     *
                     * Do NOT immediately replace existing
                     * matches with [].
                     *
                     * API-Football can temporarily return
                     * an empty response during polling.
                     */

                    if (
                        incomingMatches.length > 0
                    ) {
                        setMatches(
                            incomingMatches
                        );

                        setLastUpdated(
                            new Date()
                        );
                    } else {

                        /*
                         * If there are already matches on
                         * screen, keep them.
                         */

                        setMatches(
                            (current) =>
                                current.length
                                    ? current
                                    : []
                        );
                    }

                } catch (err) {

                    console.error(
                        "[LiveMatches] Failed:",
                        err
                    );

                    /*
                     * Don't destroy existing live
                     * matches because of one failed
                     * polling request.
                     */

                    setMatches(
                        (current) =>
                            current
                    );

                    if (
                        !matches.length
                    ) {
                        setError(
                            err?.message ||
                            "Unable to load football matches."
                        );
                    }

                } finally {

                    setLoading(false);
                }
            },
            [matches.length]
        );

    // ==========================================
    // INITIAL LOAD + POLLING
    // ==========================================

    useEffect(() => {
        let mounted = true;

        async function initialLoad() {
            if (!mounted) {
                return;
            }

            await loadMatches(true);
        }

        initialLoad();

        const interval =
            setInterval(
                () => {
                    if (!mounted) {
                        return;
                    }

                    loadMatches(false);
                },
                60000
            );

        return () => {
            mounted = false;
            clearInterval(interval);
        };

    }, [loadMatches]);

    // ==========================================
    // SORT
    // ==========================================

    const sortedMatches =
        useMemo(() => {

            return [...matches].sort(
                (a, b) => {

                    const aLive =
                        isLiveMatch(a);

                    const bLive =
                        isLiveMatch(b);

                    if (
                        aLive &&
                        !bLive
                    ) {
                        return -1;
                    }

                    if (
                        !aLive &&
                        bLive
                    ) {
                        return 1;
                    }

                    const aTime =
                        new Date(
                            a?.fixture?.date ||
                            a?.matchDate ||
                            a?.date ||
                            0
                        ).getTime();

                    const bTime =
                        new Date(
                            b?.fixture?.date ||
                            b?.matchDate ||
                            b?.date ||
                            0
                        ).getTime();

                    return (
                        aTime - bTime
                    );
                }
            );

        }, [matches]);

    const liveCount =
        matches.filter(
            isLiveMatch
        ).length;

    // ==========================================
    // LOADING
    // ==========================================

    if (
        loading &&
        matches.length === 0
    ) {
        return (
            <section className="live-matches">

                <div className="container">

                    <div className="section-header">

                        <span className="section-badge">
                            LIVE FOOTBALL
                        </span>

                        <h2>
                            Live & Upcoming Matches
                        </h2>

                        <p>
                            Real-time football
                            fixtures, scores and
                            RangoD AI intelligence.
                        </p>

                    </div>

                    <div className="matches-grid">

                        {[1, 2, 3].map(
                            (item) => (

                                <div
                                    key={item}
                                    className="match-card skeleton-card"
                                >

                                    <div className="skeleton-line" />

                                    <div className="skeleton-teams" />

                                    <div className="skeleton-line" />

                                    <div className="skeleton-button" />

                                </div>

                            )
                        )}

                    </div>

                </div>

            </section>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (
        error &&
        matches.length === 0
    ) {
        return (
            <section className="live-matches">

                <div className="container">

                    <div className="empty-state">

                        <div className="empty-icon">
                            ⚽
                        </div>

                        <h2>
                            Matches temporarily unavailable
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                loadMatches(true)
                            }
                            className="retry-btn"
                        >
                            Try Again
                        </button>

                    </div>

                </div>

            </section>
        );
    }

    // ==========================================
    // NO MATCHES
    // ==========================================

    if (
        sortedMatches.length === 0
    ) {
        return (
            <section className="live-matches">

                <div className="container">

                    <div className="section-header">

                        <span className="section-badge">
                            LIVE FOOTBALL
                        </span>

                        <h2>
                            Live & Upcoming Matches
                        </h2>

                        <p>
                            No live matches are
                            currently being played.
                        </p>

                    </div>

                    <div className="empty-state">

                        <div className="empty-icon">
                            🏟️
                        </div>

                        <h3>
                            No Live Matches
                        </h3>

                        <p>
                            Check back during
                            today's fixtures.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                loadMatches(true)
                            }
                            className="retry-btn"
                        >
                            Refresh Matches
                        </button>

                    </div>

                </div>

            </section>
        );
    }

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <section className="live-matches">

            <div className="container">

                <div className="section-header">

                    <div className="section-title-row">

                        <span className="section-badge">
                            LIVE FOOTBALL
                        </span>

                        {liveCount > 0 && (
                            <span className="live-count">

                                <span className="live-dot" />

                                {liveCount} LIVE

                            </span>
                        )}

                    </div>

                    <h2>
                        Live & Upcoming Matches
                    </h2>

                    <p>
                        Follow today's fixtures
                        with real-time match
                        information and
                        RangoD AI analysis.
                    </p>

                    {lastUpdated && (
                        <small>
                            Updated{" "}
                            {lastUpdated.toLocaleTimeString(
                                [],
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                }
                            )}
                        </small>
                    )}

                </div>

                <div className="matches-grid">

                    {sortedMatches.map(
                        (match, index) => (

                            <MatchCard
                                key={
                                    match?.fixture?.id ||
                                    match?.fixtureId ||
                                    match?.id ||
                                    match?._id ||
                                    index
                                }
                                match={match}
                                navigate={navigate}
                            />

                        )
                    )}

                </div>

            </div>

        </section>
    );
}

export default LiveMatches;