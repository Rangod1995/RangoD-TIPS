// ==========================================
// server/services/standingsService.js
// RangoD AI Engine V7 Enterprise
// League Intelligence Service
// ==========================================

import axios from "axios";
import { config } from "../config/env.js";
import { getCache, setCache } from "./cacheService.js";



// ==========================================
// Helpers
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



// ==========================================
// Empty Standings
// ==========================================

function emptyStandings(){

  return {

    league:null,

    season:null,


    teams:[],


    normalized:[],


    metadata:{

      titleRace:false,

      relegationBattle:false

    }

  };

}



// ==========================================
// Get League Standings
// ==========================================

export async function getStandings(
  leagueId,
  season
){

  const cacheKey =
    `standings-${leagueId}-${season}`;


  const cached =
    getCache(cacheKey);


  if(cached)
    return cached;



  try {


    const response =
      await axios.get(

        `${config.footballApiUrl}/standings`,

        {

          headers:{

            "x-apisports-key":
              config.footballApiKey

          },


          params:{

            league:
              leagueId,


            season

          }

        }

      );



    const raw =
      response.data.response;



    if(!raw?.length){

      return emptyStandings();

    }



    const league =
      raw[0];



    const table =
      league.league?.standings?.[0]
      || [];



    const normalized =

      table.map(
        team=>{


          const stats =
            team.all || {};


          const played =
            safeNumber(
              stats.played
            );


          const points =
            safeNumber(
              team.points
            );



          const position =
            safeNumber(
              team.rank
            );



          const winRate =
            played > 0

            ?

              (
                safeNumber(
                  stats.win
                )
                /
                played
              )
              *
              100

            :

              0;



          const goalDifference =
            safeNumber(
              stats.goals?.for
            )
            -
            safeNumber(
              stats.goals?.against
            );



          return {

            teamId:
              team.team.id,


            name:
              team.team.name,


            position,


            points,


            played,


            wins:
              safeNumber(
                stats.win
              ),


            draws:
              safeNumber(
                stats.draw
              ),


            losses:
              safeNumber(
                stats.lose
              ),


            goalsFor:
              safeNumber(
                stats.goals?.for
              ),


            goalsAgainst:
              safeNumber(
                stats.goals?.against
              ),


            goalDifference,


            winRate:
              clamp(
                winRate
              ),


            form:
              team.form || ""

          };

        }

      );



    const result = {

      league:
        league.league,


      season,


      teams:
        normalized,


      normalized,


      metadata:{

        titleRace:

          normalized.some(
            team =>
              team.position <= 3
          ),


        relegationBattle:

          normalized.some(
            team =>
              team.position >=
              normalized.length - 3
          )

      }

    };



    setCache(
      cacheKey,
      result,
      15 * 60 * 1000
    );



    return result;



  } catch(error){


    console.error(

      "Standings API Error:",

      error.response?.data ||
      error.message

    );


    return emptyStandings();

  }

}



// ==========================================
// Team Position Lookup
// ==========================================

export function getTeamStanding(
  standings,
  teamId
){

  if(
    !standings?.normalized
  )
    return null;



  return (

    standings.normalized.find(

      team =>
        team.teamId === teamId

    )

    || null

  );

}



// ==========================================
// Default Export
// ==========================================

export default {

  getStandings,

  getTeamStanding

};