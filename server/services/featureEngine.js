import { getTeamStatistics } from "./statisticsService.js";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function calculateMotivation(homeStats, awayStats) {
  const homePPG = homeStats.pointsPerGame || 1.5;
  const awayPPG = awayStats.pointsPerGame || 1.5;

  let homeMotivation = 70;
  let awayMotivation = 70;

  if (homePPG > 2.2) homeMotivation += 15;
  if (awayPPG > 2.2) awayMotivation += 15;

  if (homePPG < 1.0) homeMotivation += 10;
  if (awayPPG < 1.0) awayMotivation += 10;

  return {
    home: clamp(homeMotivation),
    away: clamp(awayMotivation)
  };
}

function calculateFatigue(homeStats, awayStats) {
  return {
    home: clamp(100 - homeStats.score),
    away: clamp(100 - awayStats.score)
  };
}

function calculateWeather() {
  return {
    condition: "Unknown",
    temperature: 22,
    wind: 8,
    rain: false,
    impact: 0
  };
}

function calculateLeagueStrength(league) {
  const profiles = {
    "Premier League": 95,
    "La Liga": 92,
    "Bundesliga": 91,
    "Serie A": 90,
    "Ligue 1": 88,
    "UEFA Champions League": 99,
    "Europa League": 94
  };

  return profiles[league] || 75;
}

export async function buildMatchFeatures(match) {

  const homeTeam = match.teams.home.name;
  const awayTeam = match.teams.away.name;

  const league = match.league.name;
  const season = match.league.season;

  const homeStats =
    await getTeamStatistics(
      homeTeam,
      league,
      season
    );

  const awayStats =
    await getTeamStatistics(
      awayTeam,
      league,
      season
    );

  const motivation =
    calculateMotivation(
      homeStats,
      awayStats
    );

  const fatigue =
    calculateFatigue(
      homeStats,
      awayStats
    );

  const weather =
    calculateWeather();

  const expectedHomeGoals =
    Number(
      (
        homeStats.goalsFor * 0.65 +
        awayStats.goalsAgainst * 0.35
      ).toFixed(2)
    );

  const expectedAwayGoals =
    Number(
      (
        awayStats.goalsFor * 0.65 +
        homeStats.goalsAgainst * 0.35
      ).toFixed(2)
    );

  const expectedGoals =
    Number(
      (
        expectedHomeGoals +
        expectedAwayGoals
      ).toFixed(2)
    );

  return {

    homeTeam,
    awayTeam,

    league,
    season,

    leagueStrength:
      calculateLeagueStrength(league),

    homeStats,
    awayStats,

    motivation,

    fatigue,

    weather,

    homeAdvantage: 10,

    attackDifference:
      homeStats.attackStrength -
      awayStats.attackStrength,

    defenseDifference:
      homeStats.defenseStrength -
      awayStats.defenseStrength,

    formDifference:
      homeStats.score -
      awayStats.score,

    expectedHomeGoals,

    expectedAwayGoals,

    expectedGoals,

    ratings: {
      home: homeStats.score,
      away: awayStats.score,
      difference:
        homeStats.score -
        awayStats.score,
    },
  };
}