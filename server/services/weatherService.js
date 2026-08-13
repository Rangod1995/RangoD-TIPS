// ==========================================
// server/services/weatherService.js
// RangoD AI Engine V7 Enterprise
// Weather Intelligence Service
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
// Weather Profile
// ==========================================

function defaultWeather(){

  return {

    condition:
      "Clear",


    temperature:
      24,


    wind:
      8,


    rain:
      0,


    humidity:
      50,


    score:
      90,


    level:
      "good",


    goalFactor:
      1,


    confidenceModifier:
      0,


    impact:
      "positive",


    explanation:

      "Good football conditions."

  };

}



// ==========================================
// Weather Impact Engine
// ==========================================

export async function getWeatherImpact(
  match = {}
){

  const weather =
    defaultWeather();



  const date =
    match.fixture?.date
      ? new Date(
          match.fixture.date
        )
      : new Date();



  const month =
    date.getUTCMonth()+1;



  // Seasonal adjustment

  if(
    [12,1,2]
      .includes(month)
  ){

    weather.temperature = 8;

  }



  if(
    [6,7,8]
      .includes(month)
  ){

    weather.temperature = 28;

  }



  // Temperature impact

  if(
    weather.temperature > 35 ||
    weather.temperature < 3
  ){

    weather.level =
      "extreme";


    weather.score =
      45;


    weather.goalFactor =
      0.75;


    weather.confidenceModifier =
      -12;


    weather.impact =
      "negative";


    weather.explanation =
      "Extreme temperature affects player performance.";

  }



  // Wind impact

  if(
    weather.wind > 30
  ){

    weather.level =
      "bad";


    weather.score =
      65;


    weather.goalFactor =
      0.85;


    weather.confidenceModifier =
      -5;


    weather.impact =
      "negative";


    weather.explanation =
      "Strong winds reduce passing accuracy.";

  }



  // Rain impact

  if(
    weather.rain > 20
  ){

    weather.condition =
      "Rain";


    weather.level =
      "bad";


    weather.score =
      60;


    weather.goalFactor =
      0.80;


    weather.confidenceModifier =
      -8;


    weather.impact =
      "negative";


    weather.explanation =
      "Rain reduces match predictability.";

  }



  // Humidity impact

  if(
    weather.humidity > 85
  ){

    weather.score -= 5;

    weather.confidenceModifier -= 3;


    weather.explanation +=
      " High humidity may increase fatigue.";

  }



  weather.score =
    clamp(
      weather.score
    );



  return {

    ...weather,


    adjustedGoalFactor:

      Number(
        weather.goalFactor
          .toFixed(2)
      ),


    reliability:

      weather.score >= 80
        ? "High"
        :
        weather.score >= 60
        ? "Medium"
        :
        "Low"

  };

}



export default {

  getWeatherImpact

};