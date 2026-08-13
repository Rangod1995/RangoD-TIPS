import Prediction from "../models/Prediction.js";

// ===========================================
// Record Prediction Result
// ===========================================
export async function recordPredictionResult(
  prediction,
  fixture
) {
  if (!fixture?.goals) return prediction;

  const homeGoals = fixture.goals.home;
  const awayGoals = fixture.goals.away;

  const totalGoals = homeGoals + awayGoals;

  const actualResult =
    homeGoals > awayGoals
      ? "Home Win"
      : awayGoals > homeGoals
      ? "Away Win"
      : "Draw";

  const marketsWon = {
    "Home Win": actualResult === "Home Win",
    "Away Win": actualResult === "Away Win",
    Draw: actualResult === "Draw",

    "Double Chance 1X":
      actualResult !== "Away Win",

    "Double Chance X2":
      actualResult !== "Home Win",

    "Double Chance 12":
      actualResult !== "Draw",

    "Over 1.5 Goals":
      totalGoals >= 2,

    "Over 2.5 Goals":
      totalGoals >= 3,

    "Over 3.5 Goals":
      totalGoals >= 4,

    "Under 1.5 Goals":
      totalGoals <= 1,

    "Under 2.5 Goals":
      totalGoals <= 2,

    "Under 3.5 Goals":
      totalGoals <= 3,

    "BTTS Yes":
      homeGoals > 0 &&
      awayGoals > 0,

    "BTTS No":
      homeGoals === 0 ||
      awayGoals === 0,
  };

  prediction.result = actualResult;

  prediction.finalScore =
    `${homeGoals}-${awayGoals}`;

  prediction.correct =
    marketsWon[
      prediction.prediction
    ] || false;

  prediction.validatedAt =
    new Date();

  await prediction.save();

  return prediction;
}

// ===========================================
// Overall Statistics
// ===========================================
export async function getOverallAccuracy() {
  const predictions =
    await Prediction.find({
      validatedAt: {
        $exists: true,
      },
    });

  const total =
    predictions.length;

  const wins =
    predictions.filter(
      (p) => p.correct
    ).length;

  return {
    total,
    wins,
    losses: total - wins,
    accuracy:
      total === 0
        ? 0
        : Number(
            (
              (wins / total) *
              100
            ).toFixed(2)
          ),
  };
}

// ===========================================
// Accuracy by Market
// ===========================================
export async function getMarketAccuracy() {
  const predictions =
    await Prediction.find({
      validatedAt: {
        $exists: true,
      },
    });

  const stats = {};

  for (const p of predictions) {
    if (!stats[p.prediction]) {
      stats[p.prediction] = {
        total: 0,
        wins: 0,
      };
    }

    stats[p.prediction].total++;

    if (p.correct) {
      stats[p.prediction].wins++;
    }
  }

  return Object.entries(stats).map(
    ([market, data]) => ({
      market,

      total: data.total,

      wins: data.wins,

      accuracy: Number(
        (
          (data.wins /
            data.total) *
          100
        ).toFixed(2)
      ),
    })
  );
}

// ===========================================
// Accuracy by League
// ===========================================
export async function getLeagueAccuracy() {
  const predictions =
    await Prediction.find({
      validatedAt: {
        $exists: true,
      },
    });

  const leagues = {};

  for (const p of predictions) {
    if (!leagues[p.league]) {
      leagues[p.league] = {
        total: 0,
        wins: 0,
      };
    }

    leagues[p.league].total++;

    if (p.correct) {
      leagues[p.league].wins++;
    }
  }

  return Object.entries(leagues).map(
    ([league, data]) => ({
      league,

      total: data.total,

      wins: data.wins,

      accuracy: Number(
        (
          (data.wins /
            data.total) *
          100
        ).toFixed(2)
      ),
    })
  );
}

// ===========================================
// Confidence Analysis
// ===========================================
export async function getConfidenceAccuracy() {
  const predictions =
    await Prediction.find({
      validatedAt: {
        $exists: true,
      },
    });

  const groups = {
    "50-59": [],
    "60-69": [],
    "70-79": [],
    "80-89": [],
    "90-99": [],
  };

  for (const p of predictions) {
    const c = p.confidence;

    if (c >= 90)
      groups["90-99"].push(p);
    else if (c >= 80)
      groups["80-89"].push(p);
    else if (c >= 70)
      groups["70-79"].push(p);
    else if (c >= 60)
      groups["60-69"].push(p);
    else
      groups["50-59"].push(p);
  }

  return Object.entries(groups).map(
    ([range, items]) => ({
      range,

      total: items.length,

      wins: items.filter(
        (x) => x.correct
      ).length,

      accuracy:
        items.length === 0
          ? 0
          : Number(
              (
                (items.filter(
                  (x) =>
                    x.correct
                ).length /
                  items.length) *
                100
              ).toFixed(2)
            ),
    })
  );
}