// ==========================================
// server/services/statisticsService.js
// RangoD AI Engine V7 Enterprise
// Statistics Intelligence Service
// ==========================================

import { getTeamForm } from "./formService.js";

const DEFAULT_SCORE = 50;
const MAX_GOALS = 5;



function safeNumber(value, fallback = 0){

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;

}



function clamp(value,min=0,max=100){

  return Math.max(
    min,
    Math.min(
      max,
      safeNumber(value,min)
    )
  );

}



function round(value,decimals=2){

  return Number(
    safeNumber(value)
      .toFixed(decimals)
  );

}



function percentage(value,total){

  if(total<=0)
    return 0;

  return round(
    value / total * 100
  );

}



// ==========================================
// Goal Normalization
// ==========================================

function normalizeGoals(value){

  return clamp(
    value / MAX_GOALS * 100
  );

}



// ==========================================
// Attack Model
// ==========================================

function calculateAttack(goals){

  return clamp(

    goals * 30 +
    Math.min(goals,2.5)*10

  ,25,99);

}



// ==========================================
// Defence Model
// ==========================================

function calculateDefence(conceded){

  return clamp(

    90 -
    conceded*20

  ,20,99);

}



// ==========================================
// Efficiency
// ==========================================

function calculateAttackEfficiency(goals){

  return clamp(
    normalizeGoals(goals)*0.8+20
  );

}



function calculateDefenceEfficiency(conceded){

  return clamp(
    100-normalizeGoals(conceded)
  );

}



// ==========================================
// Momentum
// ==========================================

function calculateMomentum(form){

  return clamp(

    55 +

    safeNumber(form.currentWinStreak)*12 +

    safeNumber(form.currentUnbeatenStreak)*5 -

    safeNumber(form.currentLossStreak)*10

  );

}



// ==========================================
// Consistency
// ==========================================

function calculateConsistency(form){

  const matches =
    safeNumber(
      form.matchesPlayed
    );


  if(!matches)
    return DEFAULT_SCORE;


  return clamp(

    safeNumber(form.winRate)*0.45 +

    percentage(
      form.cleanSheets,
      matches
    )*0.35 +

    (
      100 -
      percentage(
        form.failedToScore,
        matches
      )
    )*0.20

  );

}



// ==========================================
// Home / Away Strength
// ==========================================

function calculateHome(form){

  return clamp(

    safeNumber(form.homeForm)*0.7 +

    safeNumber(form.winRate)*0.3

  );

}



function calculateAway(form){

  return clamp(

    safeNumber(form.awayForm)*0.7 +

    safeNumber(form.winRate)*0.3

  );

}



// ==========================================
// Trend
// ==========================================

function calculateTrend(form){

  return clamp(

    safeNumber(form.attackTrend)*0.55 +

    safeNumber(form.defenseTrend)*0.45

  );

}



// ==========================================
// Rating
// ==========================================

function calculateRating(metrics){

  return Math.round(

      metrics.attack*0.20

    + metrics.defence*0.18

    + metrics.home*0.12

    + metrics.away*0.10

    + metrics.momentum*0.10

    + metrics.consistency*0.10

    + metrics.attackEfficiency*0.10

    + metrics.defenceEfficiency*0.10

    + metrics.trend*0.10

  );

}



// ==========================================
// Team Power
// ==========================================

function calculatePower(metrics,rating){

  return clamp(

      rating*0.35

    + metrics.attack*0.20

    + metrics.defence*0.20

    + metrics.momentum*0.10

    + metrics.consistency*0.10

    + metrics.trend*0.05

  );

}



// ==========================================
// Derived Metrics
// ==========================================

function buildDerived(form){

  const matches =
    Math.max(
      safeNumber(form.matchesPlayed),
      1
    );


  return {

    goalsPerGame:

      round(
        form.goalsScored / matches
      ),


    concededPerGame:

      round(
        form.goalsConceded / matches
      ),


    scoringRate:

      percentage(
        form.goalsScored,
        matches*MAX_GOALS
      )

  };

}



// ==========================================
// Main Statistics Generator
// ==========================================

export async function getTeamStatistics(
  teamId,
  options={}
){

  const form =
    await getTeamForm(teamId);



  if(!form){

    return {

      teamId,

      rating:50,

      confidence:20,

      status:
        "insufficient_data"

    };

  }



  const derived =
    buildDerived(form);



  const metrics={


    attack:
      calculateAttack(
        derived.goalsPerGame
      ),


    defence:
      calculateDefence(
        derived.concededPerGame
      ),


    home:
      calculateHome(form),


    away:
      calculateAway(form),


    momentum:
      calculateMomentum(form),


    consistency:
      calculateConsistency(form),


    attackEfficiency:
      calculateAttackEfficiency(
        derived.goalsPerGame
      ),


    defenceEfficiency:
      calculateDefenceEfficiency(
        derived.concededPerGame
      ),


    trend:
      calculateTrend(form)

  };



  const rating =
    calculateRating(metrics);



  const teamPowerIndex =
    calculatePower(
      metrics,
      rating
    );



  const confidence =
    clamp(

      (
        rating +
        metrics.consistency +
        metrics.momentum
      ) / 3

    );



  return {

    teamId,


    rating,


    teamPowerIndex:
      round(teamPowerIndex),


    confidence:
      round(confidence),



    indexes:{

      offensive:
        round(
          metrics.attack*0.45 +
          metrics.attackEfficiency*0.35 +
          metrics.trend*0.20
        ),


      defensive:
        round(
          metrics.defence*0.45 +
          metrics.defenceEfficiency*0.35 +
          metrics.consistency*0.20
        )

    },


    metrics,


    derived,


    rawForm:
      form,


    metadata:{

      engine:
        "RangoD AI Engine V7 Enterprise",


      version:
        "7.0"

    }

  };

}



// ==========================================
// Compare Teams
// ==========================================

export function compareTeamStatistics(
  homeStats,
  awayStats
){

  if(!homeStats || !awayStats)

    return {

      advantage:"unknown",

      difference:0,

      confidence:0

    };



  const difference =
    round(
      homeStats.teamPowerIndex -
      awayStats.teamPowerIndex
    );



  return {

    advantage:

      difference >=10
        ? "home"
        :
        difference <=-10
        ? "away"
        :
        "balanced",


    difference,


    homePower:
      homeStats.teamPowerIndex,


    awayPower:
      awayStats.teamPowerIndex,


    confidence:
      clamp(
        Math.abs(difference)*5
      )

  };

}



// ==========================================
// Feature Extractor
// ==========================================

export function extractPredictionFeatures(
statistics
){

  if(!statistics)
    return {};


  return {

    rating:
      statistics.rating,


    power:
      statistics.teamPowerIndex,


    attack:
      statistics.indexes?.offensive,


    defence:
      statistics.indexes?.defensive,


    confidence:
      statistics.confidence,


    momentum:
      statistics.metrics?.momentum,


    goals:
      statistics.derived?.goalsPerGame

  };

}



export default {

  getTeamStatistics,

  compareTeamStatistics,

  extractPredictionFeatures

};