import { PREDICTION_WEIGHTS, MAX_VALUES } from "../config/weights.js";
import {
  normalize,
  inverseNormalize,
  safeNumber,
} from "../utils/normalization.js";

function calculateStandingRating(rank) {
  return (
    inverseNormalize(rank, MAX_VALUES.leagueRank) *
    PREDICTION_WEIGHTS.standings
  );
}

function calculateFormRating(form) {
  return (
    normalize(
      safeNumber(form?.overallRating),
      MAX_VALUES.formRating
    ) * PREDICTION_WEIGHTS.form
  );
}

function calculateAttackRating(stats) {
  return (
    normalize(
      safeNumber(stats?.attackStrength),
      MAX_VALUES.goalsPerGame
    ) * PREDICTION_WEIGHTS.attack
  );
}

function calculateDefenceRating(stats) {
  return (
    inverseNormalize(
      safeNumber(stats?.defenseStrength),
      MAX_VALUES.goalsAgainstPerGame
    ) * PREDICTION_WEIGHTS.defence
  );
}

function calculateHomeAwayRating(stats, isHome) {
  const wins = isHome
    ? safeNumber(stats?.home?.wins)
    : safeNumber(stats?.away?.wins);

  return (
    normalize(wins, MAX_VALUES.wins) *
    PREDICTION_WEIGHTS.homeAway
  );
}

function calculateCleanSheetRating(stats) {
  return (
    normalize(
      safeNumber(stats?.cleanSheets?.total),
      MAX_VALUES.cleanSheets
    ) * PREDICTION_WEIGHTS.cleanSheets
  );
}

function calculateFailedToScoreRating(stats) {
  return (
    inverseNormalize(
      safeNumber(stats?.failedToScore?.total),
      MAX_VALUES.failedToScore
    ) * PREDICTION_WEIGHTS.failedToScore
  );
}

function calculateGoalScoringRating(stats) {
  return (
    normalize(
      safeNumber(stats?.goals?.scored?.average),
      MAX_VALUES.goalsPerGame
    ) * PREDICTION_WEIGHTS.goalScoring
  );
}

function calculateGoalConcedingRating(stats) {
  return (
    inverseNormalize(
      safeNumber(stats?.goals?.conceded?.average),
      MAX_VALUES.goalsAgainstPerGame
    ) * PREDICTION_WEIGHTS.goalConceding
  );
}

function calculateHeadToHeadRating(score) {
  return Math.min(
    PREDICTION_WEIGHTS.headToHead,
    safeNumber(score)
  );
}

function buildTeamRating({
  standing,
  form,
  stats,
  headToHead,
  isHome,
}) {
  const ratings = {
    standings: calculateStandingRating(standing?.rank),
    form: calculateFormRating(form),
    attack: calculateAttackRating(stats),
    defence: calculateDefenceRating(stats),
    homeAway: calculateHomeAwayRating(stats, isHome),
    headToHead: calculateHeadToHeadRating(headToHead),
    cleanSheets: calculateCleanSheetRating(stats),
    failedToScore: calculateFailedToScoreRating(stats),
    goalScoring: calculateGoalScoringRating(stats),
    goalConceding: calculateGoalConcedingRating(stats),
  };

  ratings.total = Object.values(ratings).reduce(
    (sum, value) => sum + value,
    0
  );

  return ratings;
}

export function calculateRatings({
  homeStanding,
  awayStanding,
  homeForm,
  awayForm,
  homeStats,
  awayStats,
  h2h,
}) {
  const home = buildTeamRating({
    standing: homeStanding,
    form: homeForm,
    stats: homeStats,
    headToHead: h2h.home,
    isHome: true,
  });

  const away = buildTeamRating({
    standing: awayStanding,
    form: awayForm,
    stats: awayStats,
    headToHead: h2h.away,
    isHome: false,
  });

  return {
    home,
    away,
    homeTotal: home.total,
    awayTotal: away.total,
    difference: Math.abs(home.total - away.total),
  };
}