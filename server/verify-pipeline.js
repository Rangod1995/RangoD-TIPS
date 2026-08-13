// Temp verification script — run, then delete.

import { calculateConfidence, confidenceLabel } from "./services/confidenceService.js";
import { validatePrediction } from "./services/predictionValidator.js";
import { selectBestMarket } from "./services/marketSelector.js";
import { generateScorePrediction } from "./services/scorelineService.js";

function assert(condition, message) {
  if (!condition) {
    console.error("❌ FAIL:", message);
    process.exitCode = 1;
    return;
  }
  console.log("✅", message);
}

// ---- confidenceService ----
const confidence = calculateConfidence({
  probabilities: { homeWin: 55, draw: 25, awayWin: 20, over25: 48, bttsYes: 52 },
  ratings: { difference: 12 },
  scorePrediction: { homeGoals: 2, awayGoals: 1, score: "2-1", scoreProbability: 40 },
  weather: { score: 90 },
  motivation: { home: 72, away: 68 },
  headToHead: { matchesPlayed: 4, homeWins: 2, awayWins: 1, draws: 1 },
  dataQuality: 0.85,
});

assert(Number.isInteger(confidence), `confidence is integer (got ${confidence})`);
assert(confidence >= 50 && confidence <= 97, `confidence within [50,97] (got ${confidence})`);
assert(typeof confidenceLabel(confidence) === "string", "confidenceLabel returns a string");

// ---- NaN safety ----
assert(
  Number.isFinite(calculateConfidence({})),
  `calculateConfidence({}) is finite (got ${calculateConfidence({})})`
);

// ---- predictionValidator ----
const validation = validatePrediction({
  selectedMarket: { market: "Over 2.5 Goals", probability: 64 },
  scorePrediction: { expectedHomeGoals: 1.6, expectedAwayGoals: 1.3 },
  probabilities: { over25: 64, under25: 36 },
  confidence: 82,
});

assert(Number.isFinite(validation.confidence), "validator confidence is finite");
assert(Number.isFinite(validation.qualityScore), "qualityScore is finite");
assert(Number.isFinite(validation.marketProbability), "marketProbability is finite");
assert(validation.qualityScore >= 0 && validation.qualityScore <= 100, "qualityScore in range");
assert(confidenceLabel(validation.confidence) !== undefined, "validator confidence is labelable");

const nanValidation = validatePrediction({ confidence: undefined });
assert(Number.isFinite(nanValidation.confidence), "validator handles missing confidence");
assert(Number.isFinite(nanValidation.qualityScore), "validator handles missing scorePrediction");

// ---- marketSelector ----
const market = selectBestMarket(
  {
    homeWin: 55, draw: 25, awayWin: 20,
    over15: 70, over25: 48, under25: 52,
    bttsYes: 55, bttsNo: 45,
  },
  {
    expectedHomeGoals: 1.6,
    expectedAwayGoals: 1.3,
    totalExpectedGoals: 2.9,
    homeGoals: 2,
    awayGoals: 1,
    score: "2-1",
  },
  { difference: 12, home: 72, away: 60 }
);

assert(typeof market.market === "string", `market.market is string (got ${market.market})`);
assert(Array.isArray(market.alternatives), "market.alternatives is array");
assert(typeof market.score === "number" && market.score >= 0 && market.score <= 100, "market.score in range");
assert(typeof market.risk === "string", "market.risk is string");
assert(market.expectedGoals === 2.9, "market.expectedGoals reads totalExpectedGoals");

// Contradiction check: a 1-0 scoreline must not select BTTS Yes or Over 2.5.
const contradictory = selectBestMarket(
  {
    homeWin: 70, draw: 20, awayWin: 10,
    over25: 20, under25: 80,
    bttsYes: 15, bttsNo: 85,
  },
  {
    expectedHomeGoals: 0.8,
    expectedAwayGoals: 0.3,
    totalExpectedGoals: 1.1,
    homeGoals: 1,
    awayGoals: 0,
    score: "1-0",
  },
  { difference: 20 }
);

assert(
  contradictory.market !== "BTTS Yes" && contradictory.market !== "Over 2.5 Goals",
  `no contradictory market for 1-0 scoreline (got ${contradictory.market})`
);

// ---- scorelineService xG scale ----
const score = await generateScorePrediction(
  { goalsFor: 1.8, goalsAgainst: 1.1, attackStrength: 66, defenseStrength: 58 },
  { goalsFor: 1.4, goalsAgainst: 1.3, attackStrength: 58, defenseStrength: 62 },
  { goalFactor: 1.08 },
  { temperature: 24, rain: 0, wind: 8 },
  { home: 72, away: 68 }
);

assert(
  score.totalExpectedGoals > 1.5 && score.totalExpectedGoals < 4.5,
  `expected goals are realistic (got ${score.totalExpectedGoals})`
);
assert(Number.isFinite(score.scoreProbability), "scoreProbability is finite");
assert(typeof score.score === "string", "scoreline is string");

console.log("\nAll pipeline checks passed.");
