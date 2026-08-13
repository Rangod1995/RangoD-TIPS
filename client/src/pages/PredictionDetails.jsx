// ==========================================
// client/src/components/PredictionDetails.jsx
// RangoD TIPS V7 Enterprise
// Prediction Details
// ==========================================

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import {
    resolvePrediction,
} from "../api/predictionApi";

import {
    useAuth,
} from "../context/AuthContext";

import "./PredictionDetails.css";

// ==========================================
// Helpers
// ==========================================

function safeNumber(
    value,
    fallback = null
) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

// ==========================================
// Confidence
// ==========================================

function getConfidence(
    prediction,
    match
) {
    const sources = [
        prediction?.confidence,
        match?.confidence,
        prediction?.confidenceScore,
        match?.confidenceScore
    ];

    for (const source of sources) {

        if (
            source &&
            typeof source === "object"
        ) {
            const value = safeNumber(
                source.confidence ??
                source.score ??
                source.value
            );

            if (value !== null) {
                return value;
            }
        }

        const value = safeNumber(source);

        if (value !== null) {
            return value;
        }
    }

    return null;
}

// ==========================================
// Confidence Label
// ==========================================

function getConfidenceLabel(
    prediction,
    match,
    confidence
) {
    const sources = [
        prediction?.confidence,
        match?.confidence
    ];

    for (const source of sources) {

        if (
            source &&
            typeof source === "object" &&
            source.label
        ) {
            return source.label;
        }
    }

    if (confidence === null) {
        return "Unavailable";
    }

    if (confidence >= 92) {
        return "Elite";
    }

    if (confidence >= 85) {
        return "Very High";
    }

    if (confidence >= 75) {
        return "High";
    }

    if (confidence >= 65) {
        return "Medium";
    }

    return "Low";
}

// ==========================================
// Risk
// ==========================================

function getRisk(
    prediction,
    match
) {
    const sources = [
        prediction?.confidence,
        match?.confidence
    ];

    for (const source of sources) {

        if (
            source &&
            typeof source === "object" &&
            source.risk
        ) {
            return source.risk;
        }
    }

    return (
        prediction?.risk ||
        match?.risk ||
        "Medium"
    );
}

// ==========================================
// Market
// ==========================================

function formatMarket(
    market
) {
    if (!market) {
        return null;
    }

    if (typeof market === "string") {
        return market;
    }

    if (typeof market === "object") {
        return (
            market.name ||
            market.market ||
            market.selection ||
            market.pick ||
            market.label ||
            market.type ||
            null
        );
    }

    return String(market);
}

// ==========================================
// EXPECTED SCORE
// ==========================================
//
// IMPORTANT:
//
// The database stores:
//
// prediction.score.home
// prediction.score.away
//
// as the predicted final score.
//
// expectedScore.expectedHome / expectedAway
// are expected-goal values such as 0.9 - 0.8.
//
// The UI should NOT display expected goals
// as the predicted final score.
//
// Therefore:
//
// 1. Use prediction.score first.
// 2. Fall back to scorePrediction.
// 3. Only use expectedScore when no actual
//    predicted score exists.
//
// ==========================================

function formatPredictedScore(
    prediction,
    match
) {
    const scoreSources = [

        // Preferred database format
        prediction?.score,

        // Possible engine formats
        prediction?.scorePrediction,

        prediction?.predictedScore,

        match?.scorePrediction,

        match?.predictedScore,

        match?.score
    ];

    for (const score of scoreSources) {

        if (!score) {
            continue;
        }

        // --------------------------------------
        // Object score
        // --------------------------------------

        if (
            typeof score === "object" &&
            !Array.isArray(score)
        ) {

            const home =
                score.home ??
                score.homeScore ??
                score.predictedHome ??
                score.predictedHomeGoals;

            const away =
                score.away ??
                score.awayScore ??
                score.predictedAway ??
                score.predictedAwayGoals;

            const homeNumber =
                safeNumber(home);

            const awayNumber =
                safeNumber(away);

            if (
                homeNumber !== null &&
                awayNumber !== null
            ) {

                return {
                    home: Math.max(
                        0,
                        Math.round(homeNumber)
                    ),

                    away: Math.max(
                        0,
                        Math.round(awayNumber)
                    )
                };
            }
        }

        // --------------------------------------
        // String score
        // --------------------------------------

        if (
            typeof score === "string"
        ) {

            const matchScore =
                score.match(
                    /(\d+(?:\.\d+)?)\s*[-:]\s*(\d+(?:\.\d+)?)/
                );

            if (matchScore) {

                return {
                    home: Math.max(
                        0,
                        Math.round(
                            Number(matchScore[1])
                        )
                    ),

                    away: Math.max(
                        0,
                        Math.round(
                            Number(matchScore[2])
                        )
                    )
                };
            }
        }
    }

    // --------------------------------------
    // Last fallback:
    // Convert expected goals into a
    // reasonable predicted score.
    //
    // This is ONLY used when the engine did
    // not provide an actual predicted score.
    // --------------------------------------

    const expectedScore =
        prediction?.expectedScore ??
        match?.expectedScore;

    if (
        expectedScore &&
        typeof expectedScore === "object"
    ) {

        const expectedHome =
            safeNumber(
                expectedScore.expectedHome ??
                expectedScore.home ??
                expectedScore.expectedHomeGoals
            );

        const expectedAway =
            safeNumber(
                expectedScore.expectedAway ??
                expectedScore.away ??
                expectedScore.expectedAwayGoals
            );

        if (
            expectedHome !== null &&
            expectedAway !== null
        ) {

            return {
                home: Math.max(
                    0,
                    Math.round(expectedHome)
                ),

                away: Math.max(
                    0,
                    Math.round(expectedAway)
                )
            };
        }
    }

    return null;
}

// ==========================================
// Component
// ==========================================

function PredictionDetails() {

    const { id } =
        useParams();

    const { user } =
        useAuth();

    const [match, setMatch] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);

    // ==========================================
    // Premium
    // ==========================================

    const isPremiumUser =
        useMemo(() => {

            if (!user) {
                return false;
            }

            return (
                user.isPremium === true ||
                user.subscription === "premium" ||
                user.subscription?.status === "active" ||
                user.subscription?.plan === "premium" ||
                user.subscription?.plan === "monthly" ||
                user.subscription?.plan === "yearly"
            );

        }, [user]);

    // ==========================================
    // Load Prediction
    // ==========================================

    useEffect(() => {

        let mounted = true;

        async function loadPrediction() {

            if (!id) {

                setError(
                    "Prediction ID is missing."
                );

                setMatch(null);
                setLoading(false);

                return;
            }

            try {

                setLoading(true);
                setError(null);

                console.log(
                    "[PredictionDetails] Loading:",
                    id
                );

                const data =
                    await resolvePrediction(id);

                if (!mounted) {
                    return;
                }

                console.log(
                    "[PredictionDetails] Resolved prediction:",
                    data
                );

                if (!data) {

                    setMatch(null);

                    setError(
                        "Prediction is not available for this fixture."
                    );

                    return;
                }

                setMatch(data);

            } catch (err) {

                if (!mounted) {
                    return;
                }

                console.error(
                    "[PredictionDetails] ERROR:",
                    err
                );

                setMatch(null);

                setError(
                    err?.message ||
                    "Failed to load prediction details."
                );

            } finally {

                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadPrediction();

        return () => {
            mounted = false;
        };

    }, [id]);

    // ==========================================
    // Normalize Prediction
    // ==========================================

    const prediction =
        useMemo(() => {

            if (
                match?.prediction &&
                typeof match.prediction === "object"
            ) {

                return match.prediction;
            }

            if (
                match &&
                (
                    match.analysis ||
                    match.confidence ||
                    match.selection ||
                    match.market
                )
            ) {

                return match;
            }

            return {};

        }, [match]);

    // ==========================================
    // Recommendation
    // ==========================================

    const predictionSelection =
        formatMarket(
            prediction.recommendedMarket ??
            prediction.selection ??
            prediction.market ??
            prediction.pick ??
            match?.recommendedMarket ??
            match?.selection ??
            match?.market
        );

    // ==========================================
    // Confidence
    // ==========================================

    const confidence =
        useMemo(() => {

            const value =
                getConfidence(
                    prediction,
                    match
                );

            if (value === null) {
                return null;
            }

            return Math.max(
                0,
                Math.min(
                    100,
                    Math.round(value)
                )
            );

        }, [
            prediction,
            match
        ]);

    const confidenceLabel =
        getConfidenceLabel(
            prediction,
            match,
            confidence
        );

    // ==========================================
    // Risk
    // ==========================================

    const risk =
        getRisk(
            prediction,
            match
        );

    // ==========================================
    // Predicted Score
    // ==========================================

    const predictedScore =
        useMemo(() => {

            return formatPredictedScore(
                prediction,
                match
            );

        }, [
            prediction,
            match
        ]);

    // ==========================================
    // Expected Goals
    // ==========================================

    const expectedGoals =
        useMemo(() => {

            const expected =
                prediction?.expectedScore ??
                match?.expectedScore;

            if (
                !expected ||
                typeof expected !== "object"
            ) {
                return null;
            }

            const home =
                safeNumber(
                    expected.expectedHome ??
                    expected.home ??
                    expected.expectedHomeGoals
                );

            const away =
                safeNumber(
                    expected.expectedAway ??
                    expected.away ??
                    expected.expectedAwayGoals
                );

            if (
                home === null ||
                away === null
            ) {
                return null;
            }

            return `${home.toFixed(1)} - ${away.toFixed(1)}`;

        }, [
            prediction,
            match
        ]);

    // ==========================================
    // Status
    // ==========================================

    const status =
        match?.status ??
        prediction.status ??
        "pending";

    // ==========================================
    // Premium
    // ==========================================

    const isLocked =
        Boolean(
            match?.isPremium ??
            prediction?.isPremium
        ) &&
        !isPremiumUser;

    // ==========================================
    // Analysis
    // ==========================================

    const analysis =
        useMemo(() => {

            const items = [];

            if (
                Array.isArray(
                    prediction.reasoning
                )
            ) {

                items.push(
                    ...prediction.reasoning
                        .filter(Boolean)
                        .map(String)
                );
            }

            if (
                typeof prediction.reasoning === "string"
            ) {

                items.push(
                    prediction.reasoning
                );
            }

            if (
                Array.isArray(
                    prediction.analysis
                )
            ) {

                items.push(
                    ...prediction.analysis
                        .filter(Boolean)
                        .map(String)
                );
            }

            if (
                typeof prediction.analysis === "string"
            ) {

                items.push(
                    prediction.analysis
                );
            }

            if (
                Array.isArray(
                    match?.analysis
                )
            ) {

                items.push(
                    ...match.analysis
                        .filter(Boolean)
                        .map(String)
                );
            }

            if (
                typeof match?.analysis === "string"
            ) {

                items.push(
                    match.analysis
                );
            }

            const intelligence =
                match?.intelligence;

            if (
                intelligence?.comparison
            ) {

                items.push(
                    "The teams' recent statistical strength and overall performance were compared."
                );
            }

            if (
                intelligence?.headToHead
            ) {

                items.push(
                    "Previous meetings between the teams were considered where relevant."
                );
            }

            if (
                intelligence?.weather
            ) {

                items.push(
                    "Expected weather conditions were included in the match assessment."
                );
            }

            if (
                intelligence?.motivation
            ) {

                items.push(
                    "Team motivation and the importance of the match were considered."
                );
            }

            if (items.length) {

                return [
                    ...new Set(items)
                ];
            }

            return [
                "RangoD TIPS generated this prediction using the available statistical and match data."
            ];

        }, [
            prediction,
            match
        ]);

    // ==========================================
    // Loading
    // ==========================================

    if (loading) {

        return (
            <section className="prediction-details">

                <div className="details-card loading-card">

                    <div className="loading-spinner" />

                    <h2>
                        Loading AI prediction...
                    </h2>

                    <p>
                        RangoD TIPS is retrieving
                        the latest match analysis.
                    </p>

                </div>

            </section>
        );
    }

    // ==========================================
    // Error
    // ==========================================

    if (
        error ||
        !match
    ) {

        return (
            <section className="prediction-details">

                <div className="details-card error-card">

                    <div className="error-icon">
                        ⚠
                    </div>

                    <h2>
                        {error ||
                            "Prediction unavailable."}
                    </h2>

                    <p>
                        The prediction could not
                        be loaded for this match.
                    </p>

                    <Link to="/predictions">
                        ← Back to Predictions
                    </Link>

                </div>

            </section>
        );
    }

    // ==========================================
    // Teams
    // ==========================================

    const homeTeam =
        match.homeTeam ||
        match.teams?.home?.name ||
        match.match?.homeTeam ||
        "Home Team";

    const awayTeam =
        match.awayTeam ||
        match.teams?.away?.name ||
        match.match?.awayTeam ||
        "Away Team";

    const league =
        typeof match.league === "string"
            ? match.league
            : match.league?.name ||
              match.match?.league ||
              "Unknown League";

    // ==========================================
    // Render
    // ==========================================

    return (

        <section className="prediction-details">

            <div className="details-container">

                <Link
                    to="/predictions"
                    className="back-link"
                >
                    ← Back to Predictions
                </Link>

                <div className="details-card">

                    <header className="details-header">

                        <div className="league-badge">
                            {league}
                        </div>

                        <h1>

                            {homeTeam}

                            <span>
                                {" "}vs{" "}
                            </span>

                            {awayTeam}

                        </h1>

                        <p>
                            RangoD TIPS Match Analysis
                        </p>

                    </header>

                    {isLocked ? (

                        <div className="locked-overlay">

                            <div className="lock-icon-large">
                                🔒
                            </div>

                            <h2>
                                Premium Prediction
                            </h2>

                            <p>
                                Unlock the complete
                                RangoD AI analysis,
                                advanced probabilities,
                                confidence breakdown
                                and premium insights.
                            </p>

                            <Link
                                to="/pricing"
                                className="upgrade-btn"
                            >
                                Upgrade to Premium
                            </Link>

                        </div>

                    ) : (

                        <div className="prediction-content">

                            {/* ================================= */}
                            {/* MAIN PICK */}
                            {/* ================================= */}

                            <div className="main-prediction">

                                <span className="prediction-label">
                                    RANGOD TIPS PICK
                                </span>

                                <h2>
                                    {predictionSelection ||
                                        "Prediction unavailable"}
                                </h2>

                                <p className="prediction-summary">

                                    {predictionSelection
                                        ? `RangoD TIPS currently favors ${predictionSelection} based on the available match data and statistical signals.`
                                        : "RangoD TIPS could not determine a clear betting selection from the available data."}

                                </p>

                                {confidence !== null && (

                                    <div className="confidence-section">

                                        <div className="confidence-header">

                                            <span>
                                                Prediction Confidence
                                            </span>

                                            <strong>
                                                {confidence}%
                                            </strong>

                                        </div>

                                        <div className="confidence-bar">

                                            <div
                                                className="confidence-fill"
                                                style={{
                                                    width:
                                                        `${confidence}%`
                                                }}
                                            />

                                        </div>

                                        <div className="confidence-meta">

                                            <span>
                                                {confidenceLabel}
                                            </span>

                                            <span>
                                                {confidence < 65
                                                    ? "High uncertainty"
                                                    : confidence < 75
                                                        ? "Use caution"
                                                        : "Stronger statistical support"}
                                            </span>

                                        </div>

                                    </div>
                                )}

                            </div>

                            {/* ================================= */}
                            {/* DETAILS GRID */}
                            {/* ================================= */}

                            <div className="details-grid">

                                <div className="info-box">

                                    <span>
                                        Our Pick
                                    </span>

                                    <strong>
                                        {predictionSelection ||
                                            "Unavailable"}
                                    </strong>

                                </div>

                                <div className="info-box">

                                    <span>
                                        Predicted Score
                                    </span>

                                    <strong>
                                        {predictedScore
                                            ? `${predictedScore.home} - ${predictedScore.away}`
                                            : "Unavailable"}
                                    </strong>

                                </div>

                                {expectedGoals && (

                                    <div className="info-box">

                                        <span>
                                            Expected Goals
                                        </span>

                                        <strong>
                                            {expectedGoals}
                                        </strong>

                                    </div>

                                )}

                                <div className="info-box">

                                    <span>
                                        Risk
                                    </span>

                                    <strong>
                                        {risk}
                                    </strong>

                                </div>

                                <div className="info-box">

                                    <span>
                                        Analysis Status
                                    </span>

                                    <strong>
                                        {status}
                                    </strong>

                                </div>

                            </div>

                            {/* ================================= */}
                            {/* ANALYSIS */}
                            {/* ================================= */}

                            <div className="analysis-box">

                                <div className="analysis-heading">

                                    <span>
                                        MATCH ANALYSIS
                                    </span>

                                    <h3>
                                        Why we like this pick
                                    </h3>

                                </div>

                                <ul>

                                    {analysis.map(
                                        (
                                            item,
                                            index
                                        ) => (

                                            <li
                                                key={`${index}-${item}`}
                                            >
                                                {item}
                                            </li>

                                        )
                                    )}

                                </ul>

                            </div>

                            {/* ================================= */}
                            {/* CONFIDENCE EXPLANATION */}
                            {/* ================================= */}

                            <div className="confidence-explanation">

                                <span>
                                    CONFIDENCE
                                </span>

                                <h3>
                                    What does {confidence ?? "--"}% confidence mean?
                                </h3>

                                <p>
                                    This percentage represents how strongly the available statistical signals support the prediction. A higher percentage means the signals are more consistent, but no football prediction is guaranteed.
                                </p>

                                <p>
                                    <strong>
                                        Important:
                                    </strong>{" "}
                                    RangoD TIPS predictions are statistical estimates, not guaranteed results. Always consider the risks before making any betting decision.
                                </p>

                            </div>

                            {(match.isPremium ||
                                prediction.isPremium) && (

                                <div className="premium-indicator">

                                    👑 Premium AI Prediction

                                </div>
                            )}

                        </div>
                    )}

                </div>

            </div>

        </section>
    );
}

export default PredictionDetails;