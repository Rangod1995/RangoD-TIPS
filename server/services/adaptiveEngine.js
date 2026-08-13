import Prediction from "../models/Prediction.js";


// ==========================================
// Default Model Weights
// ==========================================

const DEFAULT_WEIGHTS = {

  leagueWeights: {},

  marketWeights: {},

  confidenceWeights: {

    "50-59": 1.00,

    "60-69": 1.02,

    "70-79": 1.04,

    "80-89": 1.06,

    "90-99": 1.08,

  },


  riskWeights: {

    Low: 1.05,

    Medium: 1.00,

    High: 0.95,

  },


  venueWeights: {

    Home: 1.02,

    Away: 1.00,

  },

};



const MIN_SAMPLE = 10;

const MIN_DATASET = 50;



// ==========================================
// Helpers
// ==========================================

function clamp(
  value,
  min,
  max
){

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

}



function confidenceBand(
  confidence = 50
){

  if(confidence >= 90)
    return "90-99";


  if(confidence >= 80)
    return "80-89";


  if(confidence >= 70)
    return "70-79";


  if(confidence >= 60)
    return "60-69";


  return "50-59";

}



function calculateWeight(
  accuracy
){

  return Number(

    clamp(
      0.85 +
      accuracy * 0.35,

      0.80,

      1.20

    ).toFixed(3)

  );

}



// ==========================================
// Recent Prediction Importance
// ==========================================

function recencyWeight(
  date
){

  if(!date)
    return 1;


  const age =
    Date.now() -
    new Date(date).getTime();


  const days =
    age /
    (1000 * 60 * 60 * 24);



  if(days < 30)
    return 1.15;


  if(days < 90)
    return 1.05;


  return 1;

}



// ==========================================
// Build Learning Groups
// ==========================================

function buildGroups(
  predictions,
  key
){

  const groups = {};



  for(const prediction of predictions){


    const value =
      key(prediction);


    if(!value)
      continue;



    if(!groups[value]){

      groups[value] = {

        wins:0,

        total:0,

        weight:0,

      };

    }



    const importance =
      recencyWeight(
        prediction.createdAt
      );


    groups[value].total += importance;


    if(
      prediction.result === "WIN"
    ){

      groups[value].wins += importance;

    }

  }



  const result = {};



  Object.entries(groups)
  .forEach(
    ([name,data])=>{


      if(
        data.total < MIN_SAMPLE
      ){

        result[name]=1;

        return;

      }



      const accuracy =
        data.wins /
        data.total;



      result[name] =
        calculateWeight(
          accuracy
        );


    });


  return result;

}



// ==========================================
// Confidence Learning
// ==========================================

function calculateConfidenceWeights(
 predictions
){

 const groups = {

  "50-59":{
    wins:0,
    total:0
  },

  "60-69":{
    wins:0,
    total:0
  },

  "70-79":{
    wins:0,
    total:0
  },

  "80-89":{
    wins:0,
    total:0
  },

  "90-99":{
    wins:0,
    total:0
  },

 };



 for(const prediction of predictions){


  const band =
    confidenceBand(
      prediction.confidence
    );


  const importance =
    recencyWeight(
      prediction.createdAt
    );


  groups[band].total += importance;


  if(
    prediction.result === "WIN"
  ){

    groups[band].wins += importance;

  }

 }



 const result = {};



 Object.keys(groups)
 .forEach(
  band=>{


    const item =
      groups[band];


    if(
      item.total < MIN_SAMPLE
    ){

      result[band] =
        DEFAULT_WEIGHTS
        .confidenceWeights[band];

      return;

    }



    result[band] =
      calculateWeight(
        item.wins /
        item.total
      );


  });



 return result;

}



// ==========================================
// Normalize
// ==========================================

function normalize(
 weights
){

 const values =
   Object.values(weights);


 if(!values.length)
   return weights;



 const average =
   values.reduce(
    (a,b)=>a+b,
    0
   )
   /
   values.length;



 const output={};



 Object.keys(weights)
 .forEach(
 key=>{

   output[key]=Number(

     (
       weights[key] /
       average

     )
     .toFixed(3)

   );

 });



 return output;

}



// ==========================================
// Main Adaptive Engine
// ==========================================

export async function getAdaptiveWeights(){


 const predictions =
 await Prediction.find({

   validated:true,

   result:{
    $in:[
      "WIN",
      "LOSS"
    ]
   }

 })
 .select(
 `
 league
 prediction
 confidence
 result
 metadata
 createdAt
 `
 )
 .lean();



 if(
  predictions.length <
  MIN_DATASET
 ){

 return {

   ...DEFAULT_WEIGHTS,

   samples:
     predictions.length,

   accuracy:0,

   version:
     "4.0.0",

   generatedAt:
     new Date()
     .toISOString(),

 };

 }



 const wins =
 predictions.filter(
  p =>
  p.result === "WIN"
 )
 .length;



 const accuracy =
 Number(

 (
  wins /
  predictions.length *
  100

 )
 .toFixed(2)

 );



 const weights = {


  leagueWeights:

   normalize(
    buildGroups(
     predictions,
     p=>p.league
    )
   ),



  marketWeights:

   normalize(
    buildGroups(
     predictions,
     p=>p.prediction
    )
   ),



  riskWeights:

   normalize(
    buildGroups(
     predictions,
     p=>p.metadata?.risk
    )
   ),



  confidenceWeights:

   calculateConfidenceWeights(
    predictions
   ),



  venueWeights:

   DEFAULT_WEIGHTS
   .venueWeights,



 };



 return {


  ...weights,


  samples:
    predictions.length,


  accuracy,


  modelHealth:

    accuracy >=75
    ? "Excellent"

    : accuracy >=65
    ? "Good"

    : accuracy >=55
    ? "Average"

    : "Needs Improvement",



  generatedAt:
    new Date()
    .toISOString(),



  version:
    "4.0.0",


 };


}



// ==========================================
// Retrain
// ==========================================

export async function retrainAdaptiveModel(){

 const weights =
   await getAdaptiveWeights();


 return {

  success:true,

  message:
   "Adaptive AI model retrained.",

  ...weights,

 };

}



// ==========================================
// Analytics
// ==========================================

export async function getAdaptiveAnalytics(){

 return await getAdaptiveWeights();

}