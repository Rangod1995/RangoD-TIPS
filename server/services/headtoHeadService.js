// ==========================================
// server/services/headToHeadService.js
// RangoD AI Engine V7 Enterprise
// Head To Head Intelligence
// ==========================================

import axios from "axios";
import { config } from "../config/env.js";
import { getCache, setCache } from "./cacheService.js";



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
// Empty H2H Object
// ==========================================

function emptyHeadToHead(){

  return {

    score:50,

    weight:50,


    matchesPlayed:0,


    homeWins:0,

    awayWins:0,

    draws:0,


    homeGoals:0,

    awayGoals:0,


    averageGoals:0,


    bttsRate:0,


    over15Rate:0,

    over25Rate:0,

    over35Rate:0,


    dominance:50,


    competitiveness:50,


    recentResults:[],


    fixtures:[]

  };

}



// ==========================================
// H2H Intelligence
// ==========================================

export async function getHeadToHead(

  homeId,

  awayId,

  last = 5

){

  const cacheKey =
    `h2h-${homeId}-${awayId}-${last}`;


  const cached =
    getCache(cacheKey);


  if(cached)
    return cached;



  try{


    const {data} =
      await axios.get(

        `${config.footballApiUrl}/fixtures/headtohead`,

        {

          headers:{

            "x-apisports-key":
              config.footballApiKey

          },


          params:{

            h2h:
              `${homeId}-${awayId}`,

            last

          }

        }

      );



    const fixtures =
      data.response || [];



    if(!fixtures.length){

      return emptyHeadToHead();

    }



    let homeWins=0;

    let awayWins=0;

    let draws=0;



    let homeGoals=0;

    let awayGoals=0;



    let btts=0;

    let over15=0;

    let over25=0;

    let over35=0;



    const recentResults=[];



    fixtures.forEach(
      fixture=>{


        const home =
          safeNumber(
            fixture.goals?.home
          );


        const away =
          safeNumber(
            fixture.goals?.away
          );



        homeGoals += home;

        awayGoals += away;



        if(home>away){

          homeWins++;

          recentResults.push("H");

        }

        else if(away>home){

          awayWins++;

          recentResults.push("A");

        }

        else{

          draws++;

          recentResults.push("D");

        }



        const total =
          home+away;



        if(
          home>0 &&
          away>0
        )
          btts++;



        if(total>=2)
          over15++;


        if(total>=3)
          over25++;


        if(total>=4)
          over35++;


      }

    );



    const matchesPlayed =
      fixtures.length;



    const averageGoals =
      round(
        (
          homeGoals+
          awayGoals
        )
        /
        matchesPlayed
      );



    const bttsRate =
      round(
        btts /
        matchesPlayed *
        100
      );



    const over15Rate =
      round(
        over15 /
        matchesPlayed *
        100
      );



    const over25Rate =
      round(
        over25 /
        matchesPlayed *
        100
      );



    const over35Rate =
      round(
        over35 /
        matchesPlayed *
        100
      );



    const dominance =

      clamp(

        50 +

        (
          homeWins -
          awayWins
        )
        /
        Math.max(
          matchesPlayed,
          1
        )
        *
        50

      );



    const competitiveness =

      clamp(

        100 -

        Math.abs(
          homeWins -
          awayWins
        )
        /
        Math.max(
          matchesPlayed,
          1
        )
        *
        100

      );



    const score =

      Math.round(

          over25Rate * 0.25

        + bttsRate * 0.20

        + dominance * 0.20

        + competitiveness * 0.15

        + clamp(
            averageGoals /
            4 *
            100
          )
          *0.20

      );



    const result={


      score,

      weight:
        score,


      matchesPlayed,


      homeWins,

      awayWins,

      draws,


      homeGoals,

      awayGoals,


      averageGoals,


      bttsRate,


      over15Rate,

      over25Rate,

      over35Rate,


      dominance,


      competitiveness,


      recentResults,


      fixtures


    };



    setCache(
      cacheKey,
      result,
      10*60*1000
    );


    return result;



  }catch(error){


    console.error(

      "Error fetching H2H:",

      error.response?.data ||
      error.message

    );


    return emptyHeadToHead();

  }

}



export default {

  getHeadToHead

};