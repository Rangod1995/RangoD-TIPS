import Prediction from "../models/Prediction.js";

function percentage(total, value) {
    if (!total) return 0;
    return Number(((value / total) * 100).toFixed(2));
}

function normalizeWeight(accuracy) {
    if (accuracy <= 50) return 0.80;
    if (accuracy >= 90) return 1.20;

    return Number(
        (
            0.80 +
            ((accuracy - 50) / 40) * 0.40
        ).toFixed(3)
    );
}

async function calculateMarketWeights(predictions) {

    const markets = {};

    for (const prediction of predictions) {

        const market = prediction.prediction;

        if (!market) continue;

        if (!markets[market]) {

            markets[market] = {
                market,
                total: 0,
                wins: 0,
                losses: 0,
            };

        }

        markets[market].total++;

        if (prediction.result === "WIN")
            markets[market].wins++;

        if (prediction.result === "LOSS")
            markets[market].losses++;
    }

    Object.values(markets).forEach((market) => {

        market.accuracy = percentage(
            market.total,
            market.wins
        );

        market.weight = normalizeWeight(
            market.accuracy
        );

    });

    return markets;
}

async function calculateLeagueWeights(predictions) {

    const leagues = {};

    for (const prediction of predictions) {

        const league = prediction.league;

        if (!league) continue;

        if (!leagues[league]) {

            leagues[league] = {
                league,
                total: 0,
                wins: 0,
                losses: 0,
            };

        }

        leagues[league].total++;

        if (prediction.result === "WIN")
            leagues[league].wins++;

        if (prediction.result === "LOSS")
            leagues[league].losses++;
    }

    Object.values(leagues).forEach((league) => {

        league.accuracy = percentage(
            league.total,
            league.wins
        );

        league.weight = normalizeWeight(
            league.accuracy
        );

    });

    return leagues;
}

async function calculateConfidenceWeights(predictions) {

    const bands = {
        "50-59": [],
        "60-69": [],
        "70-79": [],
        "80-89": [],
        "90-99": [],
    };

    for (const prediction of predictions) {

        const confidence =
            Number(prediction.confidence) || 50;

        let band = "50-59";

        if (confidence >= 90)
            band = "90-99";
        else if (confidence >= 80)
            band = "80-89";
        else if (confidence >= 70)
            band = "70-79";
        else if (confidence >= 60)
            band = "60-69";

        bands[band].push(prediction);
    }

    const output = {};

    for (const band of Object.keys(bands)) {

        const predictions = bands[band];

        const wins =
            predictions.filter(
                p => p.result === "WIN"
            ).length;

        const accuracy = percentage(
            predictions.length,
            wins
        );

        output[band] = {
            band,
            total: predictions.length,
            accuracy,
            weight: normalizeWeight(
                accuracy
            ),
        };
    }

    return output;
}

export async function trainLearningModel() {

    const predictions = await Prediction.find({
        result: {
            $in: ["WIN", "LOSS"],
        },
    }).lean();

    const marketWeights =
        await calculateMarketWeights(predictions);

    const leagueWeights =
        await calculateLeagueWeights(predictions);

    const confidenceWeights =
        await calculateConfidenceWeights(predictions);

    return {

        trainedAt:
            new Date().toISOString(),

        samples:
            predictions.length,

        marketWeights,

        leagueWeights,

        confidenceWeights,

        version: "3.0.0",
    };
}