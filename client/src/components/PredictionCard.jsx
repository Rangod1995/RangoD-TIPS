// ==========================================
// client/src/components/PredictionCard.jsx
// RangoD TIPS V7 Enterprise
// Safe Prediction Card
// ==========================================

import {
    NavLink
} from "react-router-dom";

import "./PredictionCard.css";

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

        const items =
            value
                .map(
                    item =>
                        safeText(
                            item,
                            ""
                        )
                )
                .filter(Boolean);

        return items.length
            ? items.join(" • ")
            : fallback;
    }

    if (
        typeof value === "object"
    ) {

        return (

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

            safeText(
                value.pick,
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
                value.value,
                ""
            ) ||

            safeText(
                value.text,
                ""
            ) ||

            safeText(
                value.summary,
                ""
            ) ||

            fallback
        );
    }

    return fallback;
}

// ==========================================
// PREDICTION TEXT
// ==========================================

function getPredictionText(
    prediction
) {

    if (!prediction) {

        return "AI Prediction Available";
    }

    if (
        typeof prediction === "string"
    ) {

        return prediction;
    }

    if (
        typeof prediction === "object"
    ) {

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

    return safeText(
        prediction,
        "AI Prediction Available"
    );
}

// ==========================================
// CONFIDENCE
// ==========================================

function getConfidenceValue(
    confidence
) {

    if (
        confidence !== null &&
        typeof confidence === "object" &&
        !Array.isArray(confidence)
    ) {

        const value =
            confidence.confidence ??
            confidence.score ??
            confidence.value;

        const number =
            Number(value);

        return Number.isFinite(number)
            ? Math.max(
                0,
                Math.min(
                    100,
                    number
                )
            )
            : null;
    }

    const number =
        Number(
            confidence
        );

    return Number.isFinite(number)
        ? Math.max(
            0,
            Math.min(
                100,
                number
            )
        )
        : null;
}

// ==========================================
// CONFIDENCE LABEL
// ==========================================

function getConfidenceLabel(
    confidence,
    value
) {

    if (
        confidence &&
        typeof confidence === "object" &&
        confidence.label
    ) {

        return safeText(
            confidence.label,
            ""
        );
    }

    if (
        value === null
    ) {

        return "Unavailable";
    }

    if (
        value >= 85
    ) {

        return "Very High";
    }

    if (
        value >= 75
    ) {

        return "High";
    }

    if (
        value >= 60
    ) {

        return "Medium";
    }

    return "Low";
}

// ==========================================
// ANALYSIS
// ==========================================

function getAnalysisText(
    analysis
) {

    if (!analysis) {
        return "";
    }

    if (
        typeof analysis === "string"
    ) {

        return analysis;
    }

    if (
        Array.isArray(analysis)
    ) {

        return analysis
            .map(
                item =>
                    safeText(
                        item,
                        ""
                    )
            )
            .filter(Boolean)
            .join(" ");
    }

    if (
        typeof analysis === "object"
    ) {

        return (

            safeText(
                analysis.summary,
                ""
            ) ||

            safeText(
                analysis.reasoning,
                ""
            ) ||

            safeText(
                analysis.text,
                ""
            ) ||

            safeText(
                analysis.message,
                ""
            ) ||

            safeText(
                analysis.analysis,
                ""
            ) ||

            ""
        );
    }

    return safeText(
        analysis,
        ""
    );
}

// ==========================================
// COMPONENT
// ==========================================

function PredictionCard({

    _id,

    fixtureId,

    homeTeam,

    awayTeam,

    league,

    prediction,

    confidence,

    analysis,

    isPremium,

    isPremiumUser = false

}) {

    // ======================================
    // RESOLVE ID
    // ======================================

    const resolvedId =
        fixtureId ||
        _id;

    console.log(
        "[PredictionCard] Prediction:",
        {
            _id,
            fixtureId,
            resolvedId,
            homeTeam,
            awayTeam
        }
    );

    // ======================================
    // LOCK
    // ======================================

    const isLocked =
        Boolean(
            isPremium
        ) &&
        !isPremiumUser;

    // ======================================
    // VALUES
    // ======================================

    const predictionText =
        getPredictionText(
            prediction
        );

    const confidenceValue =
        getConfidenceValue(
            confidence
        );

    const confidenceLabel =
        getConfidenceLabel(
            confidence,
            confidenceValue
        );

    const analysisText =
        getAnalysisText(
            analysis
        );

    const homeName =
        safeText(
            homeTeam,
            "Home Team"
        );

    const awayName =
        safeText(
            awayTeam,
            "Away Team"
        );

    const leagueName =
        safeText(
            league,
            "Unknown League"
        );

    // ======================================
    // RENDER
    // ======================================

    return (

        <article
            className="prediction-card"
        >

            {/* LEAGUE */}

            <div className="league-btn">

                {leagueName}

            </div>

            {/* TEAMS */}

            <div className="teams">

                <h3>
                    {homeName}
                </h3>

                <h3>
                    vs
                </h3>

                <h3>
                    {awayName}
                </h3>

            </div>

            {/* PREDICTION */}

            <div className="prediction-info">

                <p>

                    <strong>
                        Prediction:
                    </strong>

                    {" "}

                    {predictionText}

                </p>

                {/* CONFIDENCE */}

                <p className="confidence">

                    Confidence:

                    {" "}

                    {
                        confidenceValue !== null

                            ? `${Math.round(
                                confidenceValue
                            )}%`

                            : "N/A"
                    }

                </p>

                {
                    confidenceValue !== null && (

                        <small>

                            {confidenceLabel}

                        </small>

                    )
                }

            </div>

            {/* ANALYSIS */}

            {
                !isLocked &&
                analysisText && (

                    <div
                        className="analysis-preview"
                    >

                        {analysisText}

                    </div>
                )
            }

            {/* PREMIUM */}

            {
                isLocked && (

                    <div
                        className="premium-lock"
                    >

                        🔒 Premium Prediction

                    </div>
                )
            }

            {/* VIEW */}

            {
                resolvedId ? (

                    <NavLink
                        to={`/predictions/${encodeURIComponent(
                            resolvedId
                        )}`}
                        className="prediction-btn"
                    >

                        {
                            isLocked
                                ? "Unlock Premium ⭐"
                                : "View Analysis →"
                        }

                    </NavLink>

                ) : (

                    <button
                        type="button"
                        className="prediction-btn"
                        disabled
                    >

                        Prediction Unavailable

                    </button>
                )
            }

        </article>
    );
}

export default PredictionCard;