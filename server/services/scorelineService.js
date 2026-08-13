// server/services/scorelineService.js

// ==========================================
// RangoD AI Engine V7 Enterprise
// Scoreline Prediction Service
// ==========================================


function safeNumber(value, fallback = 0) {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;

}


function clamp(value, min = 0, max = 100) {

  return Math.max(
    min,
    Math.min(
      max,
      safeNumber(value, min)
    )
  );

}


function round(value, decimals = 2) {

  return Number(
    safeNumber(value).toFixed(decimals)
  );

}



// ==========================================
// Attack Intelligence
// ==========================================

function calculateAttackStrength(stats = {}) {

  return clamp(

    safeNumber(stats.goalsPerGame, 1.2) * 25 +

    safeNumber(stats.attackStrength, 50) * 0.55

  ,5,95);

}



// ==========================================
// Defensive Intelligence
// ==========================================

function calculateDefenseStrength(stats = {}) {

  return clamp(

    80 -

    safeNumber(
      stats.concededPerGame,
      1.2
    ) * 20 +

    safeNumber(
      stats.defenseStrength,
      50
    ) * 0.35

  ,5,95);

}



// ==========================================
// Expected Goals Model
// ==========================================

function calculateExpectedGoals(
  attack,
  defence
) {

  const attackFactor =
    attack / 50;


  const defenceFactor =
    (100 - defence) / 50;


  return clamp(

    1.35 *
    attackFactor *
    defenceFactor

  ,0.3,5);

}



// ==========================================
// Adjustments
// ==========================================

function applyWeather(
  home,
  away,
  weather = {}
) {

  const impact =
    safeNumber(
      weather.score,
      100
    );


  if (impact < 60) {

    home *= 0.90;
    away *= 0.90;

  }


  return {
    home,
    away
  };

}



function applyMotivation(
  home,
  away,
  motivation = {}
) {

  const difference =

    safeNumber(
      motivation.home,
      50
    )
    -
    safeNumber(
      motivation.away,
      50
    );


  home += difference / 120;

  away -= difference / 120;


  return {
    home,
    away
  };

}



// ==========================================
// Score Probability Matrix
// ==========================================

function buildScoreMatrix(
  homeGoals,
  awayGoals
) {

  const results = [];


  for (
    let home = 0;
    home <= 5;
    home++
  ) {


    for (
      let away = 0;
      away <= 5;
      away++
    ) {


      const distance =

        Math.abs(
          home - homeGoals
        )
        +
        Math.abs(
          away - awayGoals
        );


      const probability =

        Math.max(
          1,
          100 - distance * 18
        );


      results.push({

        score:
          `${home}-${away}`,

        homeGoals:
          home,

        awayGoals:
          away,

        probability:
          round(probability)

      });


    }

  }


  return results.sort(

    (a,b) =>
      b.probability -
      a.probability

  );

}



// ==========================================
// Main Enterprise Score Generator
// ==========================================

export async function generateScorePrediction(

  homeStats = {},

  awayStats = {},

  leagueProfile = {},

  weather = {},

  motivation = {},

  options = {}

) {


  const homeAttack =
    calculateAttackStrength(
      homeStats
    );


  const awayAttack =
    calculateAttackStrength(
      awayStats
    );


  const homeDefense =
    calculateDefenseStrength(
      homeStats
    );


  const awayDefense =
    calculateDefenseStrength(
      awayStats
    );



  let homeGoals =
    calculateExpectedGoals(
      homeAttack,
      awayDefense
    );


  let awayGoals =
    calculateExpectedGoals(
      awayAttack,
      homeDefense
    );



  const leagueFactor =
    safeNumber(
      leagueProfile.goalFactor,
      1
    );


  homeGoals *= leagueFactor;

  awayGoals *= leagueFactor;



  let adjusted =
    applyWeather(
      homeGoals,
      awayGoals,
      weather
    );


  adjusted =
    applyMotivation(
      adjusted.home,
      adjusted.away,
      motivation
    );



  homeGoals =
    clamp(
      adjusted.home,
      0,
      5
    );


  awayGoals =
    clamp(
      adjusted.away,
      0,
      5
    );



  const scorelines =
    buildScoreMatrix(
      homeGoals,
      awayGoals
    );



  const best =
    scorelines[0];



  return {

    expectedHomeGoals:
      round(homeGoals),


    expectedAwayGoals:
      round(awayGoals),


    totalExpectedGoals:
      round(
        homeGoals +
        awayGoals
      ),


    score:
      best.score,


    homeGoals:
      best.homeGoals,


    awayGoals:
      best.awayGoals,


    scoreProbability:
      best.probability,


    topScorelines:
      scorelines.slice(0,10)

  };

}



// ==========================================
// Prediction Engine Compatibility
// ==========================================

export async function calculateExpectedScore({

  homeStatistics = {},

  awayStatistics = {},

  weather = {},

  motivation = {}

}) {


  const prediction =
    await generateScorePrediction(

      homeStatistics,

      awayStatistics,

      {},

      weather,

      motivation

    );


  return {

    home:
      prediction.homeGoals,


    away:
      prediction.awayGoals,


    expectedHome:
      prediction.expectedHomeGoals,


    expectedAway:
      prediction.expectedAwayGoals,


    probability:
      prediction.scoreProbability

  };

}



// ==========================================
// Default Export
// ==========================================

export default {

  generateScorePrediction,

  calculateExpectedScore

};