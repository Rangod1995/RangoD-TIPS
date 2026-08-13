// ==========================================
// client/src/components/Hero.jsx
// RangoD TIPS V7 Enterprise
// AI Featured Prediction Hero
// ==========================================

import {
    useEffect,
    useState
} from "react";

import "./Hero.css";

import FadeIn from "./FadeIn";

import {
    NavLink
} from "react-router-dom";

import {
    getTodayPredictions
} from "../api/predictionApi";


// ==========================================
// SAFE TEXT
// Never return an object to React
// ==========================================

function safeText(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }


    if (
        typeof value === "string"
    ) {
        return (
            value.trim() ||
            fallback
        );
    }


    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }


    if (Array.isArray(value)) {

        const text =
            value
                .map(item =>
                    safeText(
                        item,
                        ""
                    )
                )
                .filter(Boolean)
                .join(" • ");

        return text || fallback;
    }


    if (
        typeof value === "object"
    ) {

        return (
            safeText(
                value.selection,
                ""
            ) ||

            safeText(
                value.recommendedMarket,
                ""
            ) ||

            safeText(
                value.market,
                ""
            ) ||

            safeText(
                value.pick,
                ""
            ) ||

            safeText(
                value.tip,
                ""
            ) ||

            safeText(
                value.recommendation,
                ""
            ) ||

            safeText(
                value.name,
                ""
            ) ||

            safeText(
                value.label,
                ""
            ) ||

            safeText(
                value.text,
                ""
            ) ||

            fallback
        );
    }


    return fallback;
}


// ==========================================
// SAFE NUMBER
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


// ==========================================
// CLAMP
// ==========================================

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


// ==========================================
// CONFIDENCE
// Supports:
// confidence: 76
//
// AND:
//
// confidence: {
//     confidence: 76,
//     label: "High",
//     risk: "Low",
//     breakdown: {}
// }
// ==========================================

function getConfidence(
    match
) {

    const raw =
        match?.confidence ??
        match?.prediction?.confidence ??
        0;


    if (
        raw &&
        typeof raw === "object" &&
        !Array.isArray(raw)
    ) {

        return {
            value: clamp(
                raw.confidence ??
                raw.score ??
                raw.value ??
                0
            ),

            label:
                safeText(
                    raw.label,
                    ""
                ),

            risk:
                safeText(
                    raw.risk,
                    ""
                )
        };
    }


    return {
        value: clamp(raw),
        label: "",
        risk: ""
    };
}


// ==========================================
// QUALITY SCORE
// ==========================================

function getQualityScore(
    match
) {

    return clamp(
        match?.validation?.qualityScore ??
        match?.validation?.score ??
        match?.prediction?.validation?.qualityScore ??
        match?.prediction?.validation?.score ??
        0
    );
}


// ==========================================
// PREMIUM SCORE
// ==========================================

function getPremiumScore(
    match
) {

    return clamp(
        match?.premiumScore ??
        match?.dailyPremiumScore ??
        0
    );
}


// ==========================================
// FEATURE SCORE
// ==========================================
//
// Used only to decide which prediction
// should appear as the featured prediction.
//
// Confidence = 50%
// Quality    = 30%
// Premium    = 20%
// ==========================================

function getFeatureScore(
    match
) {

    const confidence =
        getConfidence(
            match
        ).value;

    const quality =
        getQualityScore(
            match
        );

    const premium =
        getPremiumScore(
            match
        );


    return (
        confidence * 0.50
    ) + (
        quality * 0.30
    ) + (
        premium * 0.20
    );
}


// ==========================================
// PREDICTION TEXT
// ==========================================

function getPredictionText(
    match
) {

    const prediction =
        match?.prediction;


    if (
        !prediction
    ) {
        return "AI Prediction Available";
    }


    return (
        safeText(
            prediction.recommendedMarket,
            ""
        ) ||

        safeText(
            prediction.selection,
            ""
        ) ||

        safeText(
            prediction.market,
            ""
        ) ||

        safeText(
            prediction.pick,
            ""
        ) ||

        safeText(
            prediction.tip,
            ""
        ) ||

        safeText(
            prediction.recommendation,
            ""
        ) ||

        safeText(
            prediction.name,
            ""
        ) ||

        "AI Prediction Available"
    );
}


// ==========================================
// TEAM NAME
// ==========================================

function getHomeTeam(
    match
) {

    return (
        safeText(
            match?.homeTeam,
            ""
        ) ||

        safeText(
            match?.teams?.home?.name,
            ""
        ) ||

        "Home Team"
    );
}


function getAwayTeam(
    match
) {

    return (
        safeText(
            match?.awayTeam,
            ""
        ) ||

        safeText(
            match?.teams?.away?.name,
            ""
        ) ||

        "Away Team"
    );
}


// ==========================================
// LEAGUE
// ==========================================

function getLeague(
    match
) {

    return (
        safeText(
            match?.league,
            ""
        ) ||

        safeText(
            match?.competition,
            ""
        ) ||

        safeText(
            match?.league?.name,
            ""
        ) ||

        safeText(
            match?.fixture?.league?.name,
            ""
        ) ||

        "Football Match"
    );
}


// ==========================================
// FORMAT KICKOFF
// ==========================================

function formatKickoff(
    match
) {

    const dateValue =
        match?.matchDate ??
        match?.fixture?.date;


    if (!dateValue) {
        return "TBD";
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "TBD";
    }


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// CONFIDENCE LABEL
// ==========================================

function getConfidenceLabel(
    value,
    existingLabel
) {

    if (existingLabel) {
        return existingLabel;
    }


    if (value >= 85) {
        return "Very High";
    }


    if (value >= 75) {
        return "High";
    }


    if (value >= 60) {
        return "Medium";
    }


    return "Low";
}


// ==========================================
// COMPONENT
// ==========================================

function Hero() {

    const [
        featuredMatch,
        setFeaturedMatch
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState("");


    // ==========================================
    // LOAD FEATURED PREDICTION
    // ==========================================

    useEffect(() => {

        let mounted = true;


        async function loadFeatured() {

            setLoading(true);
            setError("");


            try {

                const response =
                    await getTodayPredictions();


                if (!mounted) {
                    return;
                }


                if (
                    !Array.isArray(
                        response
                    )
                ) {

                    throw new Error(
                        "Invalid predictions response."
                    );
                }


                if (
                    response.length === 0
                ) {

                    setFeaturedMatch(
                        null
                    );

                    return;
                }


                // ----------------------------------
                // Remove invalid predictions
                // ----------------------------------

                const validPredictions =
                    response.filter(
                        match => {

                            if (!match) {
                                return false;
                            }


                            const home =
                                getHomeTeam(
                                    match
                                );

                            const away =
                                getAwayTeam(
                                    match
                                );


                            return (
                                home &&
                                away
                            );
                        }
                    );


                if (
                    validPredictions.length === 0
                ) {

                    setFeaturedMatch(
                        null
                    );

                    return;
                }


                // ----------------------------------
                // Find strongest prediction
                // ----------------------------------

                const sorted =
                    [
                        ...validPredictions
                    ].sort(
                        (
                            a,
                            b
                        ) => {

                            const scoreA =
                                getFeatureScore(
                                    a
                                );

                            const scoreB =
                                getFeatureScore(
                                    b
                                );


                            return (
                                scoreB -
                                scoreA
                            );
                        }
                    );


                setFeaturedMatch(
                    sorted[0]
                );

            } catch (err) {

                console.error(
                    "[Hero] Failed to load featured prediction:",
                    err
                );


                if (mounted) {

                    setError(
                        err?.message ||
                        "Unable to load today's featured prediction."
                    );

                    setFeaturedMatch(
                        null
                    );
                }

            } finally {

                if (mounted) {
                    setLoading(false);
                }

            }
        }


        loadFeatured();


        return () => {
            mounted = false;
        };

    }, []);


    // ==========================================
    // DERIVED DATA
    // ==========================================

    const confidenceData =
        getConfidence(
            featuredMatch
        );


    const confidence =
        Math.round(
            confidenceData.value
        );


    const confidenceLabel =
        getConfidenceLabel(
            confidence,
            confidenceData.label
        );


    const predictionText =
        getPredictionText(
            featuredMatch
        );


    const homeTeam =
        getHomeTeam(
            featuredMatch
        );


    const awayTeam =
        getAwayTeam(
            featuredMatch
        );


    const league =
        getLeague(
            featuredMatch
        );


    const kickoff =
        formatKickoff(
            featuredMatch
        );


    const premiumScore =
        getPremiumScore(
            featuredMatch
        );


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <section className="hero">

            <div className="container hero-container">


                {/* ==================================
                    LEFT SIDE
                ================================== */}

                <FadeIn
                    direction="left"
                >

                    <div className="hero-left">

                        <span className="badge">

                            AI Powered Football
                            Predictions

                        </span>


                        <h1>

                            Smarter Football
                            Predictions,

                            <span>
                                {" "}
                                Backed by AI.
                            </span>

                        </h1>


                        <p>

                            Get daily football
                            predictions, live match
                            insights, AI-powered
                            analysis, and statistics
                            designed to help you make
                            informed decisions.

                        </p>


                        {/* ==============================
                            BUTTONS
                        ============================== */}

                        <div className="hero-buttons">

                            <NavLink
                                to="/predictions"
                                className="primary-btn"
                            >

                                View Today's Tips

                            </NavLink>


                            <NavLink
                                to="/pricing"
                                className="secondary-btn"
                            >

                                Learn More

                            </NavLink>

                        </div>


                        {/* ==============================
                            STATS
                        ============================== */}

                        <div className="hero-stats">

                            <div className="stat">

                                <h2>
                                    500+
                                </h2>

                                <span>
                                    Daily Users
                                </span>

                            </div>


                            <div className="stat">

                                <h2>
                                    20+
                                </h2>

                                <span>
                                    Competitions
                                </span>

                            </div>


                            <div className="stat">

                                <h2>
                                    95%
                                </h2>

                                <span>
                                    AI Confidence
                                </span>

                            </div>

                        </div>

                    </div>

                </FadeIn>


                {/* ==================================
                    RIGHT SIDE
                ================================== */}

                <FadeIn
                    direction="right"
                    delay={0.3}
                >

                    <div className="hero-right">

                        <div className="prediction-card">


                            {/* ==============================
                                HEADER
                            ============================== */}

                            <div className="prediction-card-header">

                                <h3>

                                    {loading
                                        ? "Loading..."
                                        : "Today's AI Pick"}

                                </h3>


                                {!loading &&
                                    featuredMatch && (
                                        <span className="ai-live-badge">
                                            AI ANALYZED
                                        </span>
                                    )
                                }

                            </div>


                            {/* ==============================
                                LOADING
                            ============================== */}

                            {loading && (

                                <div className="match">

                                    <span>
                                        Loading prediction...
                                    </span>

                                </div>

                            )}


                            {/* ==============================
                                ERROR
                            ============================== */}

                            {!loading &&
                                error && (

                                    <div className="match">

                                        <span>
                                            Unable to load
                                            featured prediction.
                                        </span>

                                    </div>

                                )
                            }


                            {/* ==============================
                                FEATURED MATCH
                            ============================== */}

                            {!loading &&
                                !error &&
                                featuredMatch && (

                                    <>

                                        {/* TEAMS */}

                                        <div className="match">

                                            <strong>
                                                {homeTeam}
                                            </strong>

                                            <span>
                                                vs
                                            </span>

                                            <strong>
                                                {awayTeam}
                                            </strong>

                                        </div>


                                        {/* LEAGUE */}

                                        <p>
                                            {league}
                                        </p>


                                        {/* PREDICTION */}

                                        <h2>
                                            {predictionText}
                                        </h2>


                                        {/* CONFIDENCE */}

                                        <div className="confidence">

                                            <span>
                                                AI Confidence
                                            </span>

                                            <strong>
                                                {confidence}%
                                            </strong>

                                        </div>


                                        {/* CONFIDENCE LABEL */}

                                        <div className="confidence-meta">

                                            <span>
                                                {confidenceLabel}
                                            </span>

                                            {confidenceData.risk && (

                                                <span>
                                                    Risk:{" "}
                                                    {confidenceData.risk}
                                                </span>

                                            )}

                                        </div>


                                        <hr />


                                        {/* KICKOFF */}

                                        <div className="confidence">

                                            <span>
                                                Kickoff
                                            </span>

                                            <strong>
                                                {kickoff}
                                            </strong>

                                        </div>


                                        {/* PREMIUM SCORE */}

                                        {premiumScore > 0 && (

                                            <div className="confidence">

                                                <span>
                                                    AI Score
                                                </span>

                                                <strong>
                                                    {Math.round(
                                                        premiumScore
                                                    )}
                                                </strong>

                                            </div>

                                        )}


                                        {/* VIEW ANALYSIS */}

                                        <NavLink
                                            to={
                                                featuredMatch._id ||
                                                featuredMatch.fixtureId
                                                    ? `/predictions/${
                                                        featuredMatch._id ||
                                                        featuredMatch.fixtureId
                                                    }`
                                                    : "/predictions"
                                            }
                                            className="hero-prediction-btn"
                                        >

                                            View Full Analysis →

                                        </NavLink>

                                    </>

                                )
                            }


                            {/* ==============================
                                EMPTY
                            ============================== */}

                            {!loading &&
                                !error &&
                                !featuredMatch && (

                                    <div className="match">

                                        <span>
                                            No predictions
                                            available today.
                                        </span>

                                    </div>

                                )
                            }

                        </div>

                    </div>

                </FadeIn>

            </div>

        </section>
    );
}


export default Hero;