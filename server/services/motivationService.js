// ==========================================
// server/services/motivationService.js
// RangoD AI Engine V7 Enterprise
// Motivation Intelligence Service
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
      safeNumber(value,min)
    )
  );

}



// ==========================================
// Motivation Engine
// ==========================================

export function getMotivation(
  match = {},
  standings = null
){

  let home = 60;

  let away = 60;



  const homeTeam =
    match?.teams?.home?.name || "";


  const awayTeam =
    match?.teams?.away?.name || "";



  const factors = {

    titleRace:false,

    relegationBattle:false,

    derby:false,

    mustWin:false

  };



  // Home advantage

  home += 5;



  // Derby detection

  if(

    homeTeam &&
    awayTeam &&

    (

      homeTeam
        .toLowerCase()
        .includes(
          awayTeam
            .split(" ")[0]
            .toLowerCase()
        )

      ||

      awayTeam
        .toLowerCase()
        .includes(
          homeTeam
            .split(" ")[0]
            .toLowerCase()
        )

    )

  ){

    home += 10;

    away += 10;

    factors.derby = true;

  }



  // Standings pressure

  if(standings){

    const homePosition =
      safeNumber(
        standings.homePosition
      );


    const awayPosition =
      safeNumber(
        standings.awayPosition
      );



    if(
      homePosition > 15
    ){

      home += 8;

      factors.relegationBattle = true;

    }



    if(
      awayPosition > 15
    ){

      away += 8;

      factors.relegationBattle = true;

    }



    if(
      homePosition <= 3
    ){

      home += 6;

      factors.titleRace = true;

    }



    if(
      awayPosition <= 3
    ){

      away += 6;

      factors.titleRace = true;

    }

  }



  home =
    clamp(home);


  away =
    clamp(away);



  const difference =
    home - away;



  return {

    home,

    away,


    difference,


    factors,


    reason:

      "Motivation calculated from match context, advantage and pressure factors."

  };

}



// ==========================================
// Prediction Engine Compatibility
// ==========================================

export function getMotivationAnalysis(
  homeTeam,
  awayTeam
){

  const result =
    getMotivation({

      teams:{

        home:{
          name:
            homeTeam || ""

        },


        away:{
          name:
            awayTeam || ""

        }

      }

    });



  return {

    home:
      result.home,


    away:
      result.away,


    difference:
      result.difference,


    factors:
      result.factors,


    summary:
      result.reason

  };

}



export default {

  getMotivation,

  getMotivationAnalysis

};