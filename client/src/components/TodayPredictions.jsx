// ==========================================
// client/src/components/TodayPredictions.jsx
// RangoD TIPS V7 Enterprise
// ==========================================

import {
    useEffect,
    useState
} from "react";

import "./TodayPredictions.css";

import PredictionCard from "./PredictionCard";

import StaggerContainer from "./StaggerContainer";

import {
    getTodayPredictions
} from "../api/predictionApi";

import {
    useAuth
} from "../context/AuthContext";

// ==========================================
// SAFE CONFIDENCE
// ==========================================

function normalizeConfidence(match) {

    const rawConfidence =
        match?.prediction?.confidence ??
        match?.confidence ??
        null;

    if (
        rawConfidence &&
        typeof rawConfidence === "object" &&
        !Array.isArray(rawConfidence)
    ) {

        const value =
            Number(
                rawConfidence.confidence ??
                rawConfidence.score ??
                rawConfidence.value
            );

        return {

            confidence:
                Number.isFinite(value)
                    ? Math.max(
                        0,
                        Math.min(
                            100,
                            value
                        )
                    )
                    : null,

            label:
                typeof rawConfidence.label === "string"
                    ? rawConfidence.label
                    : null,

            risk:
                typeof rawConfidence.risk === "string"
                    ? rawConfidence.risk
                    : null,

            breakdown:
                rawConfidence.breakdown &&
                typeof rawConfidence.breakdown === "object"
                    ? rawConfidence.breakdown
                    : {}
        };
    }

    const value =
        Number(
            rawConfidence
        );

    if (
        Number.isFinite(value)
    ) {

        return {

            confidence:
                Math.max(
                    0,
                    Math.min(
                        100,
                        value
                    )
                ),

            label: null,

            risk: null,

            breakdown: {}
        };
    }

    return {

        confidence: null,

        label: null,

        risk: null,

        breakdown: {}
    };
}

// ==========================================
// SAFE TEXT
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
        return value.trim() || fallback;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                item =>
                    safeText(
                        item,
                        ""
                    )
            )
            .filter(Boolean)
            .join(" • ");
    }

    if (
        typeof value === "object"
    ) {

        return (
            safeText(
                value.text,
                ""
            ) ||
            safeText(
                value.summary,
                ""
            ) ||
            safeText(
                value.reasoning,
                ""
            ) ||
            safeText(
                value.message,
                ""
            ) ||
            safeText(
                value.analysis,
                ""
            ) ||
            safeText(
                value.recommendation,
                ""
            ) ||
            safeText(
                value.tip,
                ""
            ) ||
            safeText(
                value.selection,
                ""
            ) ||
            safeText(
                value.market,
                ""
            ) ||
            ""
        );
    }

    return fallback;
}

// ==========================================
// PREDICTION TEXT
// ==========================================

function getPredictionText(
    match
) {

    const prediction =
        match?.prediction;

    if (!prediction) {

        return "AI Prediction Available";
    }

    if (
        typeof prediction === "string"
    ) {

        return prediction;
    }

    if (
        typeof prediction !== "object"
    ) {

        return safeText(
            prediction,
            "AI Prediction Available"
        );
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
// ANALYSIS
// ==========================================

function getAnalysis(
    match
) {

    return (

        safeText(
            match?.analysis,
            ""
        ) ||

        safeText(
            match?.intelligence?.summary,
            ""
        ) ||

        safeText(
            match?.intelligence?.reasoning,
            ""
        ) ||

        safeText(
            match?.prediction?.analysis,
            ""
        ) ||

        safeText(
            match?.prediction?.reasoning,
            ""
        )
    );
}

// ==========================================
// COMPONENT
// ==========================================

function TodayPredictions() {

    const [
        predictions,
        setPredictions
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        error,
        setError
    ] = useState(null);

    const {
        user
    } = useAuth();

    const isPremiumUser =
        user?.subscription === "premium" ||
        user?.isPremium === true;

    // ======================================
    // LOAD
    // ======================================

    useEffect(() => {

        let mounted = true;

        async function loadPredictions() {

            try {

                setLoading(true);

                setError(null);

                const data =
                    await getTodayPredictions();

                if (!mounted) {
                    return;
                }

                if (
                    !Array.isArray(data)
                ) {

                    throw new Error(
                        "Invalid predictions response."
                    );
                }

                const normalized =
                    data.map(
                        match => {

                            const confidence =
                                normalizeConfidence(
                                    match
                                );

                            return {

                                ...match,

                                confidence,

                                prediction: {

                                    ...(match?.prediction || {}),

                                    confidence
                                }
                            };
                        }
                    );

                console.log(
                    `[TodayPredictions] Loaded ${normalized.length} predictions`
                );

                setPredictions(
                    normalized
                );

            } catch (err) {

                if (!mounted) {
                    return;
                }

                console.error(
                    "Failed to load today's predictions:",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to load today's predictions."
                );

            } finally {

                if (mounted) {

                    setLoading(
                        false
                    );
                }
            }
        }

        loadPredictions();

        return () => {

            mounted = false;
        };

    }, []);

    // ======================================
    // LOADING
    // ======================================

    if (loading) {

        return (
            <section className="today-predictions">

                <div className="container">

                    <p>
                        Loading predictions...
                    </p>

                </div>

            </section>
        );
    }

    // ======================================
    // ERROR
    // ======================================

    if (error) {

        return (
            <section className="today-predictions">

                <div className="container">

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        Try Again
                    </button>

                </div>

            </section>
        );
    }

    // ======================================
    // EMPTY
    // ======================================

    if (
        predictions.length === 0
    ) {

        return (
            <section className="today-predictions">

                <div className="container">

                    <p>
                        No predictions available.
                    </p>

                </div>

            </section>
        );
    }

    // ======================================
    // RENDER
    // ======================================

    return (
        <section className="today-predictions">

            <div className="container">

                <div className="section-header">

                    <span className="section-badge">
                        AI PREDICTIONS
                    </span>

                    <h2>
                        Today's Best Predictions
                    </h2>

                    <p>
                        Our AI analyzes team form,
                        head-to-head records, injuries,
                        statistics, and many other
                        factors to generate
                        high-confidence football
                        predictions.
                    </p>

                </div>

                <StaggerContainer
                    className="prediction-grid"
                >

                    {predictions.map(
                        (
                            match,
                            index
                        ) => {

                            const confidence =
                                normalizeConfidence(
                                    match
                                );

                            const homeTeam =
                                safeText(
                                    match?.homeTeam ||
                                    match?.teams?.home?.name,
                                    "Home Team"
                                );

                            const awayTeam =
                                safeText(
                                    match?.awayTeam ||
                                    match?.teams?.away?.name,
                                    "Away Team"
                                );

                            const leagueName =
                                safeText(
                                    match?.league?.name ||
                                    match?.league ||
                                    match?.competition,
                                    "Unknown League"
                                );

                            const predictionText =
                                getPredictionText(
                                    match
                                );

                            return (

                                <PredictionCard

                                    key={
                                        match?._id ||
                                        match?.fixtureId ||
                                        index
                                    }

                                    _id={
                                        match?._id
                                    }

                                    fixtureId={
                                        match?.fixtureId
                                    }

                                    homeTeam={
                                        homeTeam
                                    }

                                    awayTeam={
                                        awayTeam
                                    }

                                    league={
                                        leagueName
                                    }

                                    prediction={
                                        predictionText
                                    }

                                    confidence={
                                        confidence
                                    }

                                    analysis={
                                        getAnalysis(
                                            match
                                        )
                                    }

                                    isPremium={
                                        Boolean(
                                            match?.isPremium
                                        )
                                    }

                                    isPremiumUser={
                                        isPremiumUser
                                    }
                                />
                            );
                        }
                    )}

                </StaggerContainer>

            </div>

        </section>
    );
}

export default TodayPredictions;