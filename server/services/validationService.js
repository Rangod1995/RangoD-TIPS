import Prediction from "../models/Prediction.js";
import { getFixtureById } from "./footballService.js";
import { trainAdaptiveWeights } from "./learningService.js";

// ==========================================
// Determine if prediction won
// ==========================================
function determineResult(prediction, fixture) {
  const homeGoals = fixture.goals?.home;
  const awayGoals = fixture.goals?.away;

  if (
    homeGoals === null ||
    homeGoals === undefined ||
    awayGoals === null ||
    awayGoals === undefined
  ) {
    return null;
  }

  const totalGoals = homeGoals + awayGoals;

  switch (prediction) {
    case "Home Win":
      return homeGoals > awayGoals;

    case "Away Win":
      return awayGoals > homeGoals;

    case "Draw":
      return homeGoals === awayGoals;

    case "Double Chance 1X":
      return homeGoals >= awayGoals;

    case "Double Chance X2":
      return awayGoals >= homeGoals;

    case "Double Chance 12":
      return homeGoals !== awayGoals;

    case "Over 1.5 Goals":
      return totalGoals >= 2;

    case "Over 2.5 Goals":
      return totalGoals >= 3;

    case "Over 3.5 Goals":
      return totalGoals >= 4;

    case "Under 1.5 Goals":
      return totalGoals <= 1;

    case "Under 2.5 Goals":
      return totalGoals <= 2;

    case "Under 3.5 Goals":
      return totalGoals <= 3;

    case "BTTS Yes":
      return homeGoals > 0 && awayGoals > 0;

    case "BTTS No":
      return homeGoals === 0 || awayGoals === 0;

    default:
      return null;
  }
}

// ==========================================
// Validate all pending predictions
// ==========================================
export async function validatePredictions() {
  const predictions = await Prediction.find({
    validated: false,
  });

  const summary = {
    checked: 0,
    updated: 0,
    won: 0,
    lost: 0,
    void: 0,
    errors: 0,
    learning: false,
  };

  for (const prediction of predictions) {
    try {
      summary.checked++;

      const fixture = await getFixtureById(
        prediction.fixtureId
      );

      if (!fixture) continue;

      const status =
        fixture.fixture?.status?.short;

      // Only validate finished matches
      if (
        !["FT", "AET", "PEN"].includes(status)
      ) {
        continue;
      }

      const correct = determineResult(
        prediction.prediction,
        fixture
      );

      prediction.validated = true;

      prediction.actualResult =
        `${fixture.goals.home}-${fixture.goals.away}`;

      if (correct === null) {
        prediction.result = "VOID";
        prediction.status = "void";
        prediction.predictionCorrect =
          null;

        summary.void++;
      } else if (correct) {
        prediction.result = "WIN";
        prediction.status = "won";
        prediction.predictionCorrect =
          true;

        prediction.accuracyScore = 100;

        summary.won++;
      } else {
        prediction.result = "LOSS";
        prediction.status = "lost";
        prediction.predictionCorrect =
          false;

        prediction.accuracyScore = 0;

        summary.lost++;
      }

      await prediction.save();

      summary.updated++;
    } catch (error) {
      summary.errors++;

      console.error(
        `Validation failed for fixture ${prediction.fixtureId}:`,
        error.message
      );
    }
  }

  // ==========================================
  // AI Self Learning
  // ==========================================

  if (summary.updated > 0) {
    try {
      console.log(
        "🧠 Starting AI Learning..."
      );

      await trainAdaptiveWeights();

      summary.learning = true;

      console.log(
        "✅ AI Learning Complete."
      );
    } catch (error) {
      console.error(
        "Learning Engine Error:",
        error.message
      );
    }
  }

  return summary;
}

// ==========================================
// Validate one prediction
// ==========================================
export async function validatePrediction(
  fixtureId
) {
  const prediction =
    await Prediction.findOne({
      fixtureId,
    });

  if (!prediction) return null;

  const fixture =
    await getFixtureById(fixtureId);

  if (!fixture) return null;

  const correct = determineResult(
    prediction.prediction,
    fixture
  );

  prediction.validated = true;

  prediction.actualResult =
    `${fixture.goals.home}-${fixture.goals.away}`;

  if (correct === null) {
    prediction.result = "VOID";
    prediction.status = "void";
    prediction.predictionCorrect =
      null;
  } else if (correct) {
    prediction.result = "WIN";
    prediction.status = "won";
    prediction.predictionCorrect =
      true;

    prediction.accuracyScore = 100;
  } else {
    prediction.result = "LOSS";
    prediction.status = "lost";
    prediction.predictionCorrect =
      false;

    prediction.accuracyScore = 0;
  }

  await prediction.save();

  return prediction;
}