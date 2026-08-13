import Prediction from "../models/Prediction.js";

function percentage(total, wins) {
    if (!total) return 0;
    return Number(((wins / total) * 100).toFixed(2));
}

async function getCompletedPredictions() {
    return Prediction.find({
        result: {
            $in: ["WIN", "LOSS"],
        },
    }).lean();
}

export async function getOverallAnalytics() {

    const predictions =
        await getCompletedPredictions();

    const total = predictions.length;

    const wins =
        predictions.filter(
            p => p.result === "WIN"
        ).length;

    const losses = total - wins;

    return {
        total,
        wins,
        losses,
        accuracy: percentage(total, wins),
    };
}

export async function getLeagueAnalytics() {

    const predictions =
        await getCompletedPredictions();

    const leagues = {};

    for (const prediction of predictions) {

        const league =
            prediction.league || "Unknown";

        if (!leagues[league]) {

            leagues[league] = {

                league,

                total: 0,

                wins: 0,

                losses: 0,

                accuracy: 0,
            };

        }

        leagues[league].total++;

        if (prediction.result === "WIN")
            leagues[league].wins++;
        else
            leagues[league].losses++;

    }

    Object.values(leagues).forEach(league => {

        league.accuracy =
            percentage(
                league.total,
                league.wins
            );

    });

    return Object.values(leagues)
        .sort((a, b) => b.accuracy - a.accuracy);

}

export async function getMarketAnalytics() {

    const predictions =
        await getCompletedPredictions();

    const markets = {};

    for (const prediction of predictions) {

        const market =
            prediction.prediction || "Unknown";

        if (!markets[market]) {

            markets[market] = {

                market,

                total: 0,

                wins: 0,

                losses: 0,

                accuracy: 0,
            };

        }

        markets[market].total++;

        if (prediction.result === "WIN")
            markets[market].wins++;
        else
            markets[market].losses++;

    }

    Object.values(markets).forEach(market => {

        market.accuracy =
            percentage(
                market.total,
                market.wins
            );

    });

    return Object.values(markets)
        .sort((a, b) => b.accuracy - a.accuracy);

}
export async function getConfidenceAnalytics() {

    const predictions = await getCompletedPredictions();

    const bands = {
        "50-59": { band: "50-59", total: 0, wins: 0, losses: 0, accuracy: 0 },
        "60-69": { band: "60-69", total: 0, wins: 0, losses: 0, accuracy: 0 },
        "70-79": { band: "70-79", total: 0, wins: 0, losses: 0, accuracy: 0 },
        "80-89": { band: "80-89", total: 0, wins: 0, losses: 0, accuracy: 0 },
        "90-99": { band: "90-99", total: 0, wins: 0, losses: 0, accuracy: 0 },
    };

    for (const prediction of predictions) {

        let band = "50-59";

        if (prediction.confidence >= 90)
            band = "90-99";
        else if (prediction.confidence >= 80)
            band = "80-89";
        else if (prediction.confidence >= 70)
            band = "70-79";
        else if (prediction.confidence >= 60)
            band = "60-69";

        bands[band].total++;

        if (prediction.result === "WIN")
            bands[band].wins++;
        else
            bands[band].losses++;
    }

    Object.values(bands).forEach(band => {
        band.accuracy = percentage(
            band.total,
            band.wins
        );
    });

    return Object.values(bands);
}

export async function getStatusAnalytics() {

    const predictions = await Prediction.find().lean();

    const statusMap = {};

    for (const prediction of predictions) {

        const status = prediction.status || "UNKNOWN";

        if (!statusMap[status]) {

            statusMap[status] = {
                status,
                total: 0,
            };

        }

        statusMap[status].total++;
    }

    return Object.values(statusMap).sort(
        (a, b) => b.total - a.total
    );
}

export async function getTimeAnalytics() {

    const predictions = await Prediction.find().lean();

    const monthly = {};

    for (const prediction of predictions) {

        const date = new Date(
            prediction.createdAt
        );

        const key =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

        if (!monthly[key]) {

            monthly[key] = {
                period: key,
                total: 0,
                wins: 0,
                losses: 0,
                accuracy: 0,
            };

        }

        monthly[key].total++;

        if (prediction.result === "WIN")
            monthly[key].wins++;

        if (prediction.result === "LOSS")
            monthly[key].losses++;
    }

    Object.values(monthly).forEach(month => {

        month.accuracy = percentage(
            month.total,
            month.wins
        );

    });

    return Object.values(monthly).sort(
        (a, b) => a.period.localeCompare(b.period)
    );
}
export async function getDashboardSummary() {

    const [
        overall,
        leagues,
        markets,
        confidence,
        status,
        timeline,
    ] = await Promise.all([
        getOverallAnalytics(),
        getLeagueAnalytics(),
        getMarketAnalytics(),
        getConfidenceAnalytics(),
        getStatusAnalytics(),
        getTimeAnalytics(),
    ]);

    const totalPredictions = overall.total;
    const totalWins = overall.wins;
    const totalLosses = overall.losses;

    const bestMarket =
        markets.length > 0 ? markets[0] : null;

    const bestLeague =
        leagues.length > 0 ? leagues[0] : null;

    const highestConfidence =
        confidence.reduce(
            (best, current) =>
                current.accuracy > best.accuracy
                    ? current
                    : best,
            {
                band: "-",
                accuracy: 0,
            }
        );

    return {
        overview: {
            totalPredictions,
            totalWins,
            totalLosses,
            overallAccuracy: overall.accuracy,
        },

        bestMarket,

        bestLeague,

        bestConfidenceBand:
            highestConfidence,

        latestMonth:
            timeline.length
                ? timeline[timeline.length - 1]
                : null,

        charts: {
            confidence,
            markets,
            leagues,
            timeline,
            status,
        },
    };
}

export async function getAnalytics() {

    const [
        overall,
        leagues,
        markets,
        confidence,
        status,
        timeline,
        dashboard,
    ] = await Promise.all([
        getOverallAnalytics(),
        getLeagueAnalytics(),
        getMarketAnalytics(),
        getConfidenceAnalytics(),
        getStatusAnalytics(),
        getTimeAnalytics(),
        getDashboardSummary(),
    ]);

    return {
        overall,
        leagues,
        markets,
        confidence,
        status,
        timeline,
        dashboard,
    };
}