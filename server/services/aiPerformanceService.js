import Prediction from "../models/Prediction.js";

// ===========================================
// Calculate Overall AI Performance
// ===========================================
export async function getAIPerformance() {
  const predictions = await Prediction.find({
    validatedAt: { $exists: true },
  });

  const total = predictions.length;

  if (total === 0) {
    return {
      totalPredictions: 0,
      correctPredictions: 0,
      incorrectPredictions: 0,
      accuracy: 0,
      averageConfidence: 0,
      confidenceAccuracyGap: 0,
    };
  }

  const correctPredictions = predictions.filter(
    (prediction) => prediction.correct
  ).length;

  const averageConfidence =
    predictions.reduce(
      (sum, prediction) =>
        sum + (prediction.confidence || 0),
      0
    ) / total;

  const accuracy =
    (correctPredictions / total) * 100;

  return {
    totalPredictions: total,

    correctPredictions,

    incorrectPredictions:
      total - correctPredictions,

    accuracy: Number(
      accuracy.toFixed(2)
    ),

    averageConfidence: Number(
      averageConfidence.toFixed(2)
    ),

    confidenceAccuracyGap: Number(
      (
        averageConfidence -
        accuracy
      ).toFixed(2)
    ),
  };
}

// ===========================================
// League Performance
// ===========================================
export async function getLeaguePerformance() {
  const predictions = await Prediction.find({
    validatedAt: { $exists: true },
  });

  const leagues = {};

  for (const prediction of predictions) {
    const league =
      prediction.league || "Unknown";

    if (!leagues[league]) {
      leagues[league] = {
        league,
        total: 0,
        wins: 0,
        averageConfidence: 0,
        confidenceTotal: 0,
      };
    }

    leagues[league].total++;

    leagues[
      league
    ].confidenceTotal +=
      prediction.confidence || 0;

    if (prediction.correct) {
      leagues[league].wins++;
    }
  }

  return Object.values(leagues).map(
    (league) => ({
      league: league.league,

      totalPredictions:
        league.total,

      correctPredictions:
        league.wins,

      accuracy: Number(
        (
          (league.wins /
            league.total) *
          100
        ).toFixed(2)
      ),

      averageConfidence: Number(
        (
          league.confidenceTotal /
          league.total
        ).toFixed(2)
      ),
    })
  );
}

// ===========================================
// Market Performance
// ===========================================
export async function getMarketPerformance() {
  const predictions = await Prediction.find({
    validatedAt: { $exists: true },
  });

  const markets = {};

  for (const prediction of predictions) {
    const market =
      prediction.prediction;

    if (!markets[market]) {
      markets[market] = {
        market,
        total: 0,
        wins: 0,
      };
    }

    markets[market].total++;

    if (prediction.correct) {
      markets[market].wins++;
    }
  }

  return Object.values(markets)
    .map((market) => ({
      market: market.market,

      totalPredictions:
        market.total,

      correctPredictions:
        market.wins,

      accuracy: Number(
        (
          (market.wins /
            market.total) *
          100
        ).toFixed(2)
      ),
    }))
    .sort(
      (a, b) =>
        b.accuracy - a.accuracy
    );
}

// ===========================================
// Confidence Bands
// ===========================================
export async function getConfidenceBands() {
  const predictions = await Prediction.find({
    validatedAt: { $exists: true },
  });

  const bands = {
    "50-59": [],
    "60-69": [],
    "70-79": [],
    "80-89": [],
    "90-99": [],
  };

  for (const prediction of predictions) {
    const confidence =
      prediction.confidence || 0;

    if (confidence >= 90)
      bands["90-99"].push(prediction);
    else if (confidence >= 80)
      bands["80-89"].push(prediction);
    else if (confidence >= 70)
      bands["70-79"].push(prediction);
    else if (confidence >= 60)
      bands["60-69"].push(prediction);
    else bands["50-59"].push(prediction);
  }

  return Object.entries(bands).map(
    ([band, predictions]) => {
      const wins =
        predictions.filter(
          (prediction) =>
            prediction.correct
        ).length;

      return {
        band,

        totalPredictions:
          predictions.length,

        correctPredictions: wins,

        accuracy:
          predictions.length === 0
            ? 0
            : Number(
                (
                  (wins /
                    predictions.length) *
                  100
                ).toFixed(2)
              ),
      };
    }
  );
}

// ===========================================
// AI Improvement Suggestions
// ===========================================
export async function getImprovementSuggestions() {
  const overall =
    await getAIPerformance();

  const markets =
    await getMarketPerformance();

  const leagues =
    await getLeaguePerformance();

  const suggestions = [];

  if (overall.accuracy < 60) {
    suggestions.push(
      "Overall prediction accuracy is below 60%. Retrain confidence weighting."
    );
  }

  if (
    overall.confidenceAccuracyGap >
    15
  ) {
    suggestions.push(
      "Confidence scores are too optimistic. Reduce confidence calibration."
    );
  }

  const weakMarkets =
    markets.filter(
      (market) =>
        market.totalPredictions >= 20 &&
        market.accuracy < 55
    );

  weakMarkets.forEach((market) => {
    suggestions.push(
      `${market.market} has low historical accuracy (${market.accuracy}%).`
    );
  });

  const weakLeagues =
    leagues.filter(
      (league) =>
        league.totalPredictions >= 20 &&
        league.accuracy < 55
    );

  weakLeagues.forEach((league) => {
    suggestions.push(
      `${league.league} requires model adjustment (${league.accuracy}% accuracy).`
    );
  });

  return suggestions;
}