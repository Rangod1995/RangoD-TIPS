// ==========================================
// client/src/pages/Predictions.jsx
// RangoD TIPS V7 Enterprise
// Predictions Page
// ==========================================

import {
    useEffect,
    useState,
    useCallback,
    useMemo
} from "react";

import {
    useSearchParams
} from "react-router-dom";

import PredictionCard
    from "../components/PredictionCard";

import {
    getPredictions
} from "../api/predictionApi";

import {
    useAuth
} from "../context/AuthContext";

import "./Predictions.css";

// ==========================================
// Helpers
// ==========================================

function safeNumber(
    value,
    fallback = null
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

// ==========================================
// Confidence
// ==========================================

function getConfidence(
    prediction
) {

    const source =
        prediction?.confidence;

    if (
        source &&
        typeof source === "object" &&
        !Array.isArray(source)
    ) {

        return safeNumber(

            source.confidence ??
            source.score ??
            source.value,

            null
        );
    }

    return safeNumber(
        source,
        null
    );
}

// ==========================================
// Market formatter
// ==========================================

function formatMarket(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return "Prediction Unavailable";
    }

    const text =
        String(value)
            .trim();

    if (!text) {
        return "Prediction Unavailable";
    }

    const marketMap = {

        homeWin:
            "Home Win",

        awayWin:
            "Away Win",

        draw:
            "Draw",

        over15:
            "Over 1.5 Goals",

        over25:
            "Over 2.5 Goals",

        over35:
            "Over 3.5 Goals",

        under25:
            "Under 2.5 Goals",

        bttsYes:
            "Both Teams To Score",

        bttsNo:
            "Both Teams Not To Score"
    };

    return (
        marketMap[text] ??
        text
    );
}

// ==========================================
// Extract Market
// ==========================================

function getMarket(
    prediction
) {

    const source =
        prediction?.prediction;

    // ======================================
    // V7 recommendedMarket
    // ======================================

    const recommended =
        source?.recommendedMarket;

    if (
        recommended &&
        typeof recommended === "object" &&
        !Array.isArray(recommended)
    ) {

        const market =
            recommended.market ??
            recommended.selection ??
            recommended.pick ??
            recommended.label;

        if (market) {
            return formatMarket(
                market
            );
        }
    }

    // ======================================
    // String recommended market
    // ======================================

    if (
        typeof recommended === "string" &&
        recommended.trim()
    ) {

        return formatMarket(
            recommended
        );
    }

    // ======================================
    // Other structures
    // ======================================

    const candidates = [

        source?.selection,

        source?.market,

        source?.pick,

        source?.label,

        prediction?.market,

        prediction?.selection,

        prediction?.pick,

        prediction?.recommendedMarket
    ];

    for (
        const candidate
        of candidates
    ) {

        if (
            typeof candidate === "string" &&
            candidate.trim()
        ) {

            return formatMarket(
                candidate
            );
        }

        if (
            candidate &&
            typeof candidate === "object" &&
            !Array.isArray(candidate)
        ) {

            const value =
                candidate.market ??
                candidate.selection ??
                candidate.pick ??
                candidate.label;

            if (
                typeof value === "string" &&
                value.trim()
            ) {

                return formatMarket(
                    value
                );
            }
        }
    }

    return "Prediction Unavailable";
}

// ==========================================
// Analysis
// ==========================================

function getAnalysis(
    prediction
) {

    if (
        typeof prediction?.analysis ===
        "string"
    ) {

        return prediction.analysis;
    }

    if (
        Array.isArray(
            prediction?.analysis
        )
    ) {

        return prediction.analysis
            .filter(Boolean)
            .join(" ");
    }

    const nested =
        prediction?.prediction;

    if (
        nested &&
        typeof nested === "object"
    ) {

        if (
            typeof nested.analysis ===
            "string"
        ) {

            return nested.analysis;
        }

        if (
            typeof nested.reasoning ===
            "string"
        ) {

            return nested.reasoning;
        }

        if (
            Array.isArray(
                nested.reasoning
            )
        ) {

            return nested.reasoning
                .filter(Boolean)
                .join(" ");
        }
    }

    return "";
}

// ==========================================
// Normalize Prediction
// ==========================================

function normalizePrediction(
    prediction
) {

    if (
        !prediction ||
        typeof prediction !== "object"
    ) {

        return null;
    }

    const confidence =
        getConfidence(
            prediction
        );

    const market =
        getMarket(
            prediction
        );

    const analysis =
        getAnalysis(
            prediction
        );

    return {

        ...prediction,

        confidence,

        market,

        analysis
    };
}

// ==========================================
// Component
// ==========================================

function Predictions() {

    const {
        user
    } = useAuth();

    const [
        searchParams,
        setSearchParams
    ] = useSearchParams();

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

    const [
        total,
        setTotal
    ] = useState(0);

    const [
        totalPages,
        setTotalPages
    ] = useState(1);

    const [
        currentPage,
        setCurrentPage
    ] = useState(1);

    const [
        search,
        setSearch
    ] = useState("");

    const [
        league,
        setLeague
    ] = useState("All");

    const [
        market,
        setMarket
    ] = useState("All");

    const [
        confidenceMin,
        setConfidenceMin
    ] = useState("");

    const [
        confidenceMax,
        setConfidenceMax
    ] = useState("");

    const [
        isPremium,
        setIsPremium
    ] = useState("All");

    const [
        sortBy,
        setSortBy
    ] = useState("matchDate");

    const [
        sortOrder,
        setSortOrder
    ] = useState("asc");

    const limit = 12;

    // ==========================================
    // URL League
    // ==========================================

    useEffect(() => {

        const selectedLeague =
            searchParams.get(
                "league"
            );

        if (selectedLeague) {

            setLeague(
                selectedLeague
            );
        }

    }, [
        searchParams
    ]);

    // ==========================================
    // Premium User
    // ==========================================

    const isPremiumUser =
        user?.subscription ===
            "premium" ||

        user?.isPremium === true ||

        user?.subscription?.status ===
            "active" ||

        user?.subscription?.plan ===
            "premium" ||

        user?.subscription?.plan ===
            "monthly" ||

        user?.subscription?.plan ===
            "yearly";

    // ==========================================
    // Fetch
    // ==========================================

    const fetchPredictions =
        useCallback(
            async (
                page = 1
            ) => {

                setLoading(true);

                setError(null);

                try {

                    console.log(
                        "[Predictions] Loading predictions..."
                    );

                    const result =
                        await getPredictions({

                            page,

                            limit,

                            search:
                                search.trim(),

                            league:
                                league === "All"
                                    ? ""
                                    : league,

                            market:
                                market === "All"
                                    ? ""
                                    : market,

                            confidenceMin:
                                confidenceMin
                                    ? Number(
                                        confidenceMin
                                    )
                                    : null,

                            confidenceMax:
                                confidenceMax
                                    ? Number(
                                        confidenceMax
                                    )
                                    : null,

                            isPremium:
                                isPremium === "All"
                                    ? null
                                    : isPremium ===
                                      "Premium",

                            sortBy,

                            sortOrder
                        });

                    console.log(
                        "[Predictions] API result:",
                        result
                    );

                    let raw = [];

                    // Array
                    if (
                        Array.isArray(
                            result
                        )
                    ) {

                        raw =
                            result;
                    }

                    // { predictions: [] }
                    else if (
                        Array.isArray(
                            result?.predictions
                        )
                    ) {

                        raw =
                            result.predictions;
                    }

                    // { data: [] }
                    else if (
                        Array.isArray(
                            result?.data
                        )
                    ) {

                        raw =
                            result.data;
                    }

                    // { data: { predictions: [] } }
                    else if (
                        Array.isArray(
                            result?.data?.predictions
                        )
                    ) {

                        raw =
                            result.data.predictions;
                    }

                    const normalized =
                        raw
                            .map(
                                normalizePrediction
                            )
                            .filter(Boolean);

                    console.log(
                        `[Predictions] Loaded ${normalized.length} predictions`
                    );

                    setPredictions(
                        normalized
                    );

                    setTotal(
                        Number(
                            result?.total ??
                            normalized.length
                        )
                    );

                    setTotalPages(
                        Number(
                            result?.totalPages ??
                            1
                        )
                    );

                    setCurrentPage(
                        Number(
                            result?.page ??
                            page
                        )
                    );

                } catch (err) {

                    console.error(
                        "[Predictions] Failed:",
                        err
                    );

                    setPredictions([]);

                    setError(
                        err?.message ||
                        "Failed to load predictions."
                    );

                } finally {

                    setLoading(false);
                }

            },
            [
                search,
                league,
                market,
                confidenceMin,
                confidenceMax,
                isPremium,
                sortBy,
                sortOrder
            ]
        );

    // ==========================================
    // Initial fetch
    // ==========================================

    useEffect(() => {

        fetchPredictions(1);

    }, [
        fetchPredictions
    ]);

    // ==========================================
    // Refresh
    // ==========================================

    const handleRefresh =
        () => {

            fetchPredictions(
                currentPage
            );
        };

    // ==========================================
    // Filters
    // ==========================================

    const handleFilterChange =
        (
            field,
            value
        ) => {

            if (
                field === "league"
            ) {

                setLeague(
                    value
                );
            }

            if (
                field === "market"
            ) {

                setMarket(
                    value
                );
            }

            if (
                field === "isPremium"
            ) {

                setIsPremium(
                    value
                );
            }

            if (
                field === "confidenceMin"
            ) {

                setConfidenceMin(
                    value
                );
            }

            if (
                field === "confidenceMax"
            ) {

                setConfidenceMax(
                    value
                );
            }

            setCurrentPage(1);
        };

    // ==========================================
    // Sort
    // ==========================================

    const handleSortChange =
        field => {

            if (
                sortBy === field
            ) {

                setSortOrder(
                    previous =>
                        previous === "asc"
                            ? "desc"
                            : "asc"
                );

            } else {

                setSortBy(
                    field
                );

                setSortOrder(
                    "desc"
                );
            }
        };

    // ==========================================
    // Leagues
    // ==========================================

    const leagues =
        useMemo(
            () => {

                return [
                    ...new Set(

                        predictions

                            .map(
                                prediction => {

                                    if (
                                        typeof prediction?.league ===
                                        "string"
                                    ) {

                                        return prediction.league;
                                    }

                                    return prediction?.league?.name;
                                }
                            )

                            .filter(Boolean)
                    )
                ];

            },
            [
                predictions
            ]
        );

    // ==========================================
    // Markets
    // ==========================================

    const markets =
        useMemo(
            () => {

                return [
                    ...new Set(

                        predictions

                            .map(
                                prediction =>
                                    prediction.market
                            )

                            .filter(
                                value =>
                                    value &&
                                    value !==
                                        "Prediction Unavailable"
                            )
                    )
                ];

            },
            [
                predictions
            ]
        );

    // ==========================================
    // Loading
    // ==========================================

    if (loading) {

        return (

            <section
                className="predictions-page"
            >

                <div className="container">

                    <h1>
                        Loading Predictions...
                    </h1>

                </div>

            </section>
        );
    }

    // ==========================================
    // Error
    // ==========================================

    if (error) {

        return (

            <section
                className="predictions-page"
            >

                <div className="container">

                    <h2>
                        {error}
                    </h2>

                    <button
                        onClick={
                            handleRefresh
                        }
                        className="btn-primary"
                    >
                        Retry
                    </button>

                </div>

            </section>
        );
    }

    // ==========================================
    // Render
    // ==========================================

    return (

        <section
            className="predictions-page"
        >

            <div className="container">

                {/* HEADER */}

                <div className="page-header">

                    <h1>

                        {league === "All"
                            ? "Football Predictions"
                            : `${league} Predictions`}

                    </h1>

                    <p>

                        {league === "All"
                            ? "Browse today's AI-powered football predictions."
                            : `Showing AI predictions for ${league}.`}

                    </p>

                    {league !== "All" && (

                        <button
                            className="btn-secondary"
                            onClick={() => {

                                setLeague(
                                    "All"
                                );

                                setSearchParams(
                                    {}
                                );

                            }}
                        >
                            Show All Leagues
                        </button>
                    )}

                </div>

                {/* FILTERS */}

                <div className="filters">

                    <input
                        placeholder="Search team..."
                        value={search}
                        onChange={
                            event =>
                                setSearch(
                                    event.target.value
                                )
                        }
                    />

                    <select
                        value={league}
                        onChange={
                            event =>
                                handleFilterChange(
                                    "league",
                                    event.target.value
                                )
                        }
                    >

                        <option value="All">
                            All
                        </option>

                        {leagues.map(
                            item => (

                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            )
                        )}

                    </select>

                    <select
                        value={market}
                        onChange={
                            event =>
                                handleFilterChange(
                                    "market",
                                    event.target.value
                                )
                        }
                    >

                        <option value="All">
                            All
                        </option>

                        {markets.map(
                            item => (

                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            )
                        )}

                    </select>

                    <button
                        onClick={
                            handleRefresh
                        }
                        className="btn-secondary"
                    >
                        Refresh
                    </button>

                </div>

                {/* SORT */}

                <div className="sort-controls">

                    <button
                        onClick={() =>
                            handleSortChange(
                                "confidence"
                            )
                        }
                    >
                        Confidence
                    </button>

                    <button
                        onClick={() =>
                            handleSortChange(
                                "matchDate"
                            )
                        }
                    >
                        Match Date
                    </button>

                    <button
                        onClick={() =>
                            handleSortChange(
                                "createdAt"
                            )
                        }
                    >
                        Newest
                    </button>

                </div>

                {/* PREDICTIONS */}

                <div
                    className="prediction-grid"
                >

                    {predictions.length > 0 ? (

                        predictions.map(
                            (
                                match,
                                index
                            ) => {

                                const confidence =
                                    getConfidence(
                                        match
                                    );

                                const predictionText =
                                    getMarket(
                                        match
                                    );

                                const homeTeam =
                                    match?.homeTeam ||
                                    match?.teams?.home?.name ||
                                    match?.match?.homeTeam ||
                                    "Home Team";

                                const awayTeam =
                                    match?.awayTeam ||
                                    match?.teams?.away?.name ||
                                    match?.match?.awayTeam ||
                                    "Away Team";

                                const leagueName =
                                    typeof match?.league ===
                                    "string"

                                        ? match.league

                                        : match?.league?.name ||

                                          match?.match?.league ||

                                          "Unknown League";

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
        getAnalysis(match)
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
                        )

                    ) : (

                        <div
                            className="empty-state"
                        >

                            <h3>
                                No predictions found.
                            </h3>

                            <p>
                                Predictions may not
                                have been generated
                                for today's fixtures
                                yet.
                            </p>

                            <button
                                onClick={
                                    handleRefresh
                                }
                                className="btn-secondary"
                            >
                                Refresh Predictions
                            </button>

                        </div>
                    )}

                </div>

                {/* PAGINATION */}

                {totalPages > 1 && (

                    <div
                        className="pagination"
                    >

                        <button

                            disabled={
                                currentPage <= 1
                            }

                            onClick={() =>
                                fetchPredictions(
                                    currentPage - 1
                                )
                            }
                        >
                            ← Previous
                        </button>

                        <span>

                            Page{" "}
                            {currentPage}{" "}
                            of{" "}
                            {totalPages}

                        </span>

                        <button

                            disabled={
                                currentPage >=
                                totalPages
                            }

                            onClick={() =>
                                fetchPredictions(
                                    currentPage + 1
                                )
                            }
                        >
                            Next →
                        </button>

                    </div>
                )}

            </div>

        </section>
    );
}

export default Predictions;