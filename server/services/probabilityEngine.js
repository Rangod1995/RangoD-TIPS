import { getFeatureWeights } from "./featureImportanceService.js";

// ==========================================
// Helpers
// ==========================================

const DEFAULT_FEATURE_WEIGHTS = {
  form: 0.2,
  attack: 0.2,
  defense: 0.15,
  venue: 0.1,
  expectedGoals: 0.15,
  scoreProbability: 0.1,
  dataQuality: 0.05,
  consensus: 0.05,
};

function clamp(value, min = 1, max = 99) {
  let number = Number(value);

  if (!Number.isFinite(number)) {
    number = min;
  }

  return Math.max(min, Math.min(max, number));
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function factorial(n) {
  if (n <= 1) return 1;

  let result = 1;

  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
}

function poisson(lambda, goals) {
  return (
    (Math.exp(-lambda) * Math.pow(lambda, goals)) /
    factorial(goals)
  );
}

// ==========================================
// Goal Matrix
// ==========================================

function buildMatrix(homeXG, awayXG, maxGoals = 6) {
  const matrix = [];

  for (let home = 0; home <= maxGoals; home++) {
    matrix[home] = [];

    for (let away = 0; away <= maxGoals; away++) {
      matrix[home][away] = poisson(homeXG, home) * poisson(awayXG, away);
    }
  }

  return matrix;
}

function sumMatrix(matrix, condition) {
  let total = 0;

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      if (condition(h, a)) {
        total += matrix[h][a];
      }
    }
  }

  return total;
}

// ==========================================
// Expected Goal Adjustment
// ==========================================

async function adjustExpectedGoals({
  scorePrediction,
  ratings,
  homeForm,
  awayForm,
  leagueProfile = {},
  headToHead,
  motivation,
  weather,
  fatigue = {},
  leagueStrength = 75,
  features,
}) {
  let homeXG = safeNumber(scorePrediction?.expectedHomeGoals, 1.2);
  let awayXG = safeNumber(scorePrediction?.expectedAwayGoals, 1.0);

  // Use model weights if supplied; otherwise fetch (with safe fallback).
  let featureWeights = features ?? {};

  if (!featureWeights.attack && !featureWeights.defense) {
    try {
      featureWeights = (await getFeatureWeights()) || {};
    } catch {
      featureWeights = {};
    }
  }

  featureWeights = {
    ...DEFAULT_FEATURE_WEIGHTS,
    ...featureWeights,
  };

  const ratingEffect = safeNumber(ratings?.difference) / 100;

  homeXG += ratingEffect * featureWeights.attack;
  awayXG -= ratingEffect * featureWeights.defense;

  homeXG += ((safeNumber(homeForm?.overallRating, 50) - 50) / 200) * featureWeights.form;
  awayXG += ((safeNumber(awayForm?.overallRating, 50) - 50) / 200) * featureWeights.form;

  // League goal factor (e.g. Bundesliga 1.18, Ligue 1 0.94).
  const goalFactor = safeNumber(leagueProfile.goalFactor, 1);
  homeXG *= goalFactor;
  awayXG *= goalFactor;

  // Home advantage is multiplicative, not +1.05 goals.
  const homeAdvantage = safeNumber(leagueProfile.homeAdvantage, 1);
  if (homeAdvantage > 0) {
    homeXG *= homeAdvantage;
  }

  if (headToHead?.summary) {
    const rate = safeNumber(headToHead.summary.homeWinRate, 50);
    homeXG += ((rate - 50) / 100) * 0.2;
  }

  // Motivation around neutral 70.
  homeXG += (safeNumber(motivation?.home, 70) - 70) / 120;
  awayXG += (safeNumber(motivation?.away, 70) - 70) / 120;

  // Weather uses the real goalFactor field (0.75-1) from weatherService.
  const weatherGoalFactor = safeNumber(weather?.goalFactor, 1);
  if (weatherGoalFactor > 0) {
    homeXG *= weatherGoalFactor;
    awayXG *= weatherGoalFactor;
  }

  homeXG -= safeNumber(fatigue?.home) / 500;
  awayXG -= safeNumber(fatigue?.away) / 500;

  homeXG += (safeNumber(leagueStrength, 75) - 75) / 400;
  awayXG += (safeNumber(leagueStrength, 75) - 75) / 400;

  return {
    homeXG: Math.max(0.2, Math.min(4.5, homeXG)),
    awayXG: Math.max(0.2, Math.min(4.5, awayXG)),
  };
}

// ==========================================
// Probability Engine
// ==========================================

export async function calculateProbabilities({
  ratings = {},
  homeForm = {},
  awayForm = {},
  scorePrediction = {},
  leagueProfile = {},
  headToHead = {},
  features = {},
  motivation = {},
  weather = {},
  fatigue = {},
  leagueStrength = 75,
}) {
  let homeXG;
  let awayXG;

  try {
    ({ homeXG, awayXG } = await adjustExpectedGoals({
      scorePrediction,
      ratings,
      homeForm,
      awayForm,
      leagueProfile,
      headToHead,
      motivation,
      weather,
      fatigue,
      leagueStrength,
      features,
    }));
  } catch {
    homeXG = safeNumber(scorePrediction?.expectedHomeGoals, 1.2);
    awayXG = safeNumber(scorePrediction?.expectedAwayGoals, 1.0);
  }

  const matrix = buildMatrix(homeXG, awayXG);

  let homeWin = sumMatrix(matrix, (h, a) => h > a);
  let draw = sumMatrix(matrix, (h, a) => h === a);
  let awayWin = sumMatrix(matrix, (h, a) => h < a);

  const total = homeWin + draw + awayWin || 1;

  homeWin /= total;
  draw /= total;
  awayWin /= total;

  const bttsYesProb = sumMatrix(matrix, (h, a) => h > 0 && a > 0);

  return {
    homeWin: clamp(Math.round(homeWin * 100)),
    draw: clamp(Math.round(draw * 100)),
    awayWin: clamp(Math.round(awayWin * 100)),

    homeOrDraw: clamp(Math.round((homeWin + draw) * 100)),
    awayOrDraw: clamp(Math.round((awayWin + draw) * 100)),
    homeOrAway: clamp(Math.round((homeWin + awayWin) * 100)),

    over15: clamp(Math.round(sumMatrix(matrix, (h, a) => h + a >= 2) * 100)),
    over25: clamp(Math.round(sumMatrix(matrix, (h, a) => h + a >= 3) * 100)),
    over35: clamp(Math.round(sumMatrix(matrix, (h, a) => h + a >= 4) * 100)),

    under15: clamp(Math.round(sumMatrix(matrix, (h, a) => h + a <= 1) * 100)),
    under25: clamp(Math.round(sumMatrix(matrix, (h, a) => h + a <= 2) * 100)),
    under35: clamp(Math.round(sumMatrix(matrix, (h, a) => h + a <= 3) * 100)),

    bttsYes: clamp(Math.round(bttsYesProb * 100)),
    bttsNo: clamp(Math.round((1 - bttsYesProb) * 100)),

    expectedGoals: {
      home: Number(homeXG.toFixed(2)),
      away: Number(awayXG.toFixed(2)),
      total: Number((homeXG + awayXG).toFixed(2)),
    },

    strength: {
      home: safeNumber(ratings.home, 50),
      away: safeNumber(ratings.away, 50),
      difference: safeNumber(ratings.difference),
      league: safeNumber(leagueStrength, 75),
    },

    matrix,
  };
}

export default {
  calculateProbabilities,
};
