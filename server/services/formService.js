// ==========================================
// server/services/formService.js
// RangoD AI Engine V7 Enterprise
// Form Intelligence Service
// ==========================================

import axios from "axios";
import { config } from "../config/env.js";
import { getCache, setCache } from "./cacheService.js";

const api = axios.create({

  baseURL:
    config.footballApiUrl,

  headers: {

    "x-apisports-key":
      config.footballApiKey

  }

});



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
      safeNumber(value,min)
    )
  );

}



function round(value, decimals = 2) {

  return Number(
    safeNumber(value)
      .toFixed(decimals)
  );

}



// ==========================================
// Empty Enterprise Form
// ==========================================

function emptyForm() {

  return {

    score:50,

    overallRating:50,


    matchesPlayed:0,


    wins:0,

    draws:0,

    losses:0,


    goalsScored:0,

    goalsConceded:0,


    averageGoals:0,

    averageConceded:0,


    cleanSheets:0,

    failedToScore:0,


    winRate:0,

    drawRate:0,

    lossRate:0,


    homeForm:50,

    awayForm:50,


    attackScore:50,

    defenseScore:50,


    attackTrend:50,

    defenseTrend:50,


    momentum:50,


    currentWinStreak:0,

    currentLossStreak:0,

    currentUnbeatenStreak:0,


    consistency:50,


    weightedForm:50,


    formConfidence:20,


    recentResults:[],


    fixtures:[]

  };

}



// ==========================================
// Trend Calculation
// ==========================================

function calculateTrend(values = []) {

  if(values.length < 2)
    return 50;


  const first =
    values[0];


  const last =
    values[values.length-1];


  return clamp(

    50 +
    (
      last-first
    ) * 10

  );

}



// ==========================================
// Team Form Generator
// ==========================================

export async function getTeamForm(
  teamId,
  last = 10
){

  const cacheKey =
    `team-form-${teamId}-${last}`;


  const cached =
    getCache(cacheKey);


  if(cached)
    return cached;



  try {


    const {data} =
      await api.get(
        "/fixtures",
        {

          params:{

            team:teamId,

            last,

            season:2026

          }

        }
      );



    const fixtures =
      data.response || [];



    if(!fixtures.length){

      return emptyForm();

    }



    let wins=0;

    let draws=0;

    let losses=0;


    let goalsScored=0;

    let goalsConceded=0;


    let cleanSheets=0;

    let failedToScore=0;


    let homePoints=0;

    let awayPoints=0;


    let homeMatches=0;

    let awayMatches=0;



    let currentWinStreak=0;

    let currentLossStreak=0;

    let currentUnbeatenStreak=0;



    let weightedPoints=0;

    let totalWeight=0;



    const recentResults=[];


    const goalHistory=[];

    const concedeHistory=[];



    fixtures.forEach(
      (match,index)=>{


        const weight =
          fixtures.length-index;



        totalWeight += weight;



        const isHome =
          match.teams.home.id === teamId;



        const scored =
          safeNumber(
            isHome
            ? match.goals.home
            : match.goals.away
          );


        const conceded =
          safeNumber(
            isHome
            ? match.goals.away
            : match.goals.home
          );



        goalsScored += scored;

        goalsConceded += conceded;



        goalHistory.push(scored);

        concedeHistory.push(conceded);



        if(conceded===0)
          cleanSheets++;



        if(scored===0)
          failedToScore++;



        let result;



        if(scored>conceded){

          wins++;

          weightedPoints += 3*weight;

          result="W";

        }

        else if(scored===conceded){

          draws++;

          weightedPoints += weight;

          result="D";

        }

        else{

          losses++;

          result="L";

        }



        recentResults.push(result);



        if(isHome){

          homeMatches++;

          if(result==="W")
            homePoints+=3;

          if(result==="D")
            homePoints+=1;

        }

        else{

          awayMatches++;

          if(result==="W")
            awayPoints+=3;

          if(result==="D")
            awayPoints+=1;

        }


      }

    );



    const matchesPlayed =
      fixtures.length;



    const averageGoals =
      round(
        goalsScored /
        Math.max(matchesPlayed,1)
      );



    const averageConceded =
      round(
        goalsConceded /
        Math.max(matchesPlayed,1)
      );



    const winRate =
      round(
        wins /
        Math.max(matchesPlayed,1)
        *100
      );



    const drawRate =
      round(
        draws /
        Math.max(matchesPlayed,1)
        *100
      );



    const lossRate =
      round(
        losses /
        Math.max(matchesPlayed,1)
        *100
      );



    const homeForm =
      clamp(
        homePoints /
        Math.max(homeMatches*3,1)
        *100
      );



    const awayForm =
      clamp(
        awayPoints /
        Math.max(awayMatches*3,1)
        *100
      );



    const attackScore =
      clamp(
        averageGoals*35
      );



    const defenseScore =
      clamp(
        100 -
        averageConceded*30
      );



    const momentum =
      clamp(

        50 +

        currentWinStreak*12 +

        currentUnbeatenStreak*5 -

        currentLossStreak*10

      );



    const consistency =
      clamp(

        winRate*0.5 +

        (100-lossRate)*0.3 +

        (100 -
        failedToScore /
        Math.max(matchesPlayed,1)
        *100)*0.2

      );



    const score =
      Math.round(

        winRate*0.35 +

        attackScore*0.20 +

        defenseScore*0.20 +

        homeForm*0.10 +

        awayForm*0.10 +

        momentum*0.05

      );



    const result={


      score,

      overallRating:score,


      matchesPlayed,


      wins,

      draws,

      losses,


      goalsScored,

      goalsConceded,


      averageGoals,

      averageConceded,


      cleanSheets,

      failedToScore,


      winRate,

      drawRate,

      lossRate,


      homeForm,

      awayForm,


      attackScore,

      defenseScore,


      attackTrend:
        calculateTrend(goalHistory),


      defenseTrend:
        calculateTrend(
          concedeHistory.map(
            x=>100-x*20
          )
        ),


      momentum,


      consistency,


      currentWinStreak,

      currentLossStreak,

      currentUnbeatenStreak,


      weightedForm:

        round(
          weightedPoints /
          Math.max(totalWeight*3,1)
          *100
        ),


      formConfidence:
        clamp(matchesPlayed*10),


      recentResults,


      fixtures

    };



    setCache(
      cacheKey,
      result,
      5*60*1000
    );


    return result;



  } catch(error){


    console.error(
      "Error fetching team form:",
      error.response?.data ||
      error.message
    );


    return emptyForm();

  }

}



export default {

  getTeamForm

};