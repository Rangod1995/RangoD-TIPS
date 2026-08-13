// ==========================================
// client/src/api/predictionApi.js
// RangoD TIPS V7 Enterprise
// Prediction API
// ==========================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const PREDICTIONS_URL =
    `${API_BASE_URL}/predictions`;

// ==========================================
// API FETCH
// ==========================================

async function apiFetch(url, options = {}) {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            60000
        );

    try {

        console.log(
            "[PredictionAPI] Request:",
            url
        );

        const response =
            await fetch(
                url,
                {
                    ...options,

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})
                    },

                    signal:
                        controller.signal
                }
            );

        const text =
            await response.text();

        let data = null;

        try {

            data =
                text
                    ? JSON.parse(text)
                    : null;

        } catch {

            data = text;

        }

        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                `Request failed with status ${response.status}`;

            throw new Error(
                message
            );
        }

        return data;

    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                "Request timed out. Please try again."
            );
        }

        throw error;

    } finally {

        clearTimeout(
            timeout
        );
    }
}

// ==========================================
// NORMALIZE API RESPONSE
// ==========================================

function normalizePredictionResponse(result) {

    if (
        Array.isArray(result)
    ) {

        return {
            success: true,
            predictions: result,
            data: result,
            count: result.length,
            total: result.length,
            page: 1,
            totalPages: 1
        };
    }

    if (
        !result ||
        typeof result !== "object"
    ) {

        return {
            success: false,
            predictions: [],
            data: [],
            count: 0,
            total: 0,
            page: 1,
            totalPages: 1
        };
    }

    let predictions = [];

    if (
        Array.isArray(
            result.predictions
        )
    ) {

        predictions =
            result.predictions;

    } else if (
        Array.isArray(
            result.data
        )
    ) {

        predictions =
            result.data;

    } else if (
        Array.isArray(
            result.data?.predictions
        )
    ) {

        predictions =
            result.data.predictions;
    }

    return {

        ...result,

        success:
            result.success !== false,

        predictions,

        data:
            predictions,

        count:
            Number(
                result.count ??
                predictions.length
            ),

        total:
            Number(
                result.total ??
                result.count ??
                predictions.length
            ),

        page:
            Number(
                result.page ??
                result.data?.page ??
                1
            ),

        totalPages:
            Number(
                result.totalPages ??
                result.data?.totalPages ??
                1
            )
    };
}

// ==========================================
// GET PREDICTIONS
// ==========================================

export async function getPredictions(
    params = {}
) {

    const searchParams =
        new URLSearchParams();

    const page =
        Number(params.page) > 0
            ? Number(params.page)
            : 1;

    const limit =
        Number(params.limit) > 0
            ? Math.min(
                Number(params.limit),
                100
            )
            : 12;

    searchParams.set(
        "page",
        String(page)
    );

    searchParams.set(
        "limit",
        String(limit)
    );

    if (params.date) {

        searchParams.set(
            "date",
            String(params.date)
        );
    }

    if (params.search) {

        searchParams.set(
            "search",
            String(params.search)
        );
    }

    if (params.league) {

        searchParams.set(
            "league",
            String(params.league)
        );
    }

    if (
        params.market !== null &&
        params.market !== undefined &&
        params.market !== ""
    ) {

        searchParams.set(
            "market",
            String(params.market)
        );
    }

    if (
        params.confidenceMin !== null &&
        params.confidenceMin !== undefined &&
        params.confidenceMin !== ""
    ) {

        searchParams.set(
            "confidenceMin",
            String(params.confidenceMin)
        );
    }

    if (
        params.confidenceMax !== null &&
        params.confidenceMax !== undefined &&
        params.confidenceMax !== ""
    ) {

        searchParams.set(
            "confidenceMax",
            String(params.confidenceMax)
        );
    }

    if (
        params.isPremium !== null &&
        params.isPremium !== undefined
    ) {

        searchParams.set(
            "isPremium",
            String(params.isPremium)
        );
    }

    if (params.sortBy) {

        searchParams.set(
            "sortBy",
            String(params.sortBy)
        );
    }

    if (params.sortOrder) {

        searchParams.set(
            "sortOrder",
            String(params.sortOrder)
        );
    }

    const url =
        `${PREDICTIONS_URL}?${searchParams.toString()}`;

    console.log(
        "[PredictionAPI] GET:",
        url
    );

    const result =
        await apiFetch(
            url
        );

    const normalized =
        normalizePredictionResponse(
            result
        );

    console.log(
        "[PredictionAPI] API result:",
        normalized
    );

    return normalized;
}

// ==========================================
// GET TODAY'S PREDICTIONS
// ==========================================

export async function getTodayPredictions() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );

    const today =
        `${year}-${month}-${day}`;

    console.log(
        "[PredictionAPI] Loading today's predictions:",
        today
    );

    const result =
        await getPredictions({

            date: today,

            page: 1,

            limit: 50,

            sortBy:
                "confidence",

            sortOrder:
                "desc"
        });

    const predictions =
        Array.isArray(
            result?.predictions
        )
            ? result.predictions
            : [];

    console.log(
        `[PredictionAPI] Today's predictions loaded: ${predictions.length}`
    );

    return predictions;
}

// ==========================================
// GET PREDICTION BY ID
// ==========================================

export async function getPrediction(id) {

    if (
        id === null ||
        id === undefined ||
        String(id).trim() === ""
    ) {

        throw new Error(
            "Prediction ID is required."
        );
    }

    return apiFetch(
        `${PREDICTIONS_URL}/${encodeURIComponent(id)}`
    );
}

// ==========================================
// GET PREDICTION BY FIXTURE
// ==========================================

export async function getPredictionByFixture(
    fixtureId
) {

    if (!fixtureId) {

        throw new Error(
            "Fixture ID is required."
        );
    }

    return apiFetch(
        `${PREDICTIONS_URL}/fixture/${encodeURIComponent(fixtureId)}`
    );
}

// ==========================================
// RESOLVE PREDICTION
// ==========================================

export async function resolvePrediction(id) {

    if (
        id === null ||
        id === undefined ||
        String(id).trim() === ""
    ) {

        throw new Error(
            "Prediction ID is required."
        );
    }

    const value =
        String(id).trim();

    console.log(
        "[PredictionAPI] Resolving:",
        value
    );

    function extractPrediction(result) {

        if (!result) {
            return null;
        }

        if (
            result._id ||
            result.fixtureId ||
            result.homeTeam ||
            result.awayTeam
        ) {
            return result;
        }

        if (
            result.prediction &&
            typeof result.prediction === "object"
        ) {

            return extractPrediction(
                result.prediction
            );
        }

        if (
            result.data &&
            typeof result.data === "object" &&
            !Array.isArray(result.data)
        ) {

            return extractPrediction(
                result.data
            );
        }

        if (
            result.result &&
            typeof result.result === "object"
        ) {

            return extractPrediction(
                result.result
            );
        }

        return null;
    }

    // --------------------------------------
    // ID endpoint
    // --------------------------------------

    try {

        const result =
            await apiFetch(
                `${PREDICTIONS_URL}/${encodeURIComponent(value)}`
            );

        const prediction =
            extractPrediction(
                result
            );

        if (prediction) {

            return prediction;
        }

    } catch (error) {

        console.warn(
            "[PredictionAPI] ID endpoint failed:",
            error?.message || error
        );
    }

    // --------------------------------------
    // Fixture endpoint
    // --------------------------------------

    const fixtureId =
        Number(value);

    if (
        Number.isFinite(fixtureId) &&
        fixtureId > 0
    ) {

        try {

            const result =
                await apiFetch(
                    `${PREDICTIONS_URL}/fixture/${fixtureId}`
                );

            const prediction =
                extractPrediction(
                    result
                );

            if (prediction) {

                return prediction;
            }

        } catch (error) {

            console.warn(
                "[PredictionAPI] Fixture endpoint failed:",
                error?.message || error
            );
        }
    }

    // --------------------------------------
    // List fallback
    // --------------------------------------

    try {

        const result =
            await getPredictions({
                page: 1,
                limit: 100
            });

        const predictions =
            Array.isArray(
                result?.predictions
            )
                ? result.predictions
                : [];

        const found =
            predictions.find(
                item => {

                    const itemId =
                        String(
                            item?._id ??
                            item?.id ??
                            ""
                        );

                    const itemFixtureId =
                        String(
                            item?.fixtureId ??
                            item?.fixture?.id ??
                            ""
                        );

                    return (
                        itemId === value ||
                        itemFixtureId === value
                    );
                }
            );

        if (found) {

            return found;
        }

    } catch (error) {

        console.error(
            "[PredictionAPI] List fallback failed:",
            error
        );
    }

    return null;
}

// ==========================================
// GENERATE
// ==========================================

export async function generatePredictions() {

    const result =
        await apiFetch(
            `${PREDICTIONS_URL}/generate`,
            {
                method: "POST"
            }
        );

    return normalizePredictionResponse(
        result
    );
}

// ==========================================
// CREATE
// ==========================================

export async function createPrediction(data) {

    return apiFetch(
        PREDICTIONS_URL,
        {
            method: "POST",

            body:
                JSON.stringify(data)
        }
    );
}

// ==========================================
// UPDATE
// ==========================================

export async function updatePrediction(
    id,
    data
) {

    if (!id) {

        throw new Error(
            "Prediction ID is required."
        );
    }

    return apiFetch(
        `${PREDICTIONS_URL}/${encodeURIComponent(id)}`,
        {
            method: "PUT",

            body:
                JSON.stringify(data)
        }
    );
}

// ==========================================
// DELETE
// ==========================================

export async function deletePrediction(id) {

    if (!id) {

        throw new Error(
            "Prediction ID is required."
        );
    }

    return apiFetch(
        `${PREDICTIONS_URL}/${encodeURIComponent(id)}`,
        {
            method: "DELETE"
        }
    );
}

// ==========================================
// DEFAULT
// ==========================================

export default {

    getPredictions,

    getTodayPredictions,

    getPrediction,

    getPredictionByFixture,

    resolvePrediction,

    generatePredictions,

    createPrediction,

    updatePrediction,

    deletePrediction
};